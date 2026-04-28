import { QueryFailedError, type DataSource, type Repository } from "typeorm";
import type {
  CreateEventInput,
  DemoUserResult,
  EventDetails,
  EventSummary,
  EventsRepository,
  User,
} from "../domain/eventsRepository";
import { EventParticipantEntity } from "./entities/event-participant.entity";
import { EventEntity } from "./entities/event.entity";
import { UserEntity } from "./entities/user.entity";

export class TypeOrmEventsRepository implements EventsRepository {
  private readonly users: Repository<UserEntity>;
  private readonly events: Repository<EventEntity>;
  private readonly participants: Repository<EventParticipantEntity>;

  constructor(dataSource: DataSource) {
    this.users = dataSource.getRepository(UserEntity);
    this.events = dataSource.getRepository(EventEntity);
    this.participants = dataSource.getRepository(EventParticipantEntity);
  }

  async createOrFindDemoUser(name: string): Promise<DemoUserResult> {
    const normalizedName = name.trim();
    const existing = await this.users.findOne({ where: { name: normalizedName } });

    if (existing) {
      return { user: this.toUser(existing), created: false };
    }

    try {
      const user = await this.users.save(this.users.create({ name: normalizedName }));
      return { user: this.toUser(user), created: true };
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const pgError = error.driverError as { code?: string };
        if (pgError.code === "23505") {
          const user = await this.users.findOne({ where: { name: normalizedName } });
          if (user) {
            return { user: this.toUser(user), created: false };
          }
        }
      }
      throw error;
    }
  }

  async listEvents(): Promise<EventSummary[]> {
    const rows = await this.events
      .createQueryBuilder("event")
      .leftJoin("event.createdBy", "createdBy")
      .leftJoin("event.participants", "participant")
      .select("event.id", "id")
      .addSelect("event.title", "title")
      .addSelect("event.description", "description")
      .addSelect("event.startsAt", "startsAt")
      .addSelect("event.location", "location")
      .addSelect("createdBy.id", "createdById")
      .addSelect("createdBy.name", "createdByName")
      .addSelect("createdBy.createdAt", "createdByCreatedAt")
      .addSelect("COUNT(participant.userId)", "participantCount")
      .groupBy("event.id")
      .addGroupBy("createdBy.id")
      .orderBy("event.startsAt", "ASC")
      .getRawMany<{
        id: string;
        title: string;
        description: string;
        startsAt: Date;
        location: string;
        createdById: string;
        createdByName: string;
        createdByCreatedAt: Date;
        participantCount: string;
      }>();

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      startsAt: new Date(row.startsAt).toISOString(),
      location: row.location,
      createdBy: {
        id: row.createdById,
        name: row.createdByName,
        createdAt: new Date(row.createdByCreatedAt).toISOString(),
      },
      participantCount: Number(row.participantCount),
    }));
  }

  async createEvent(input: CreateEventInput): Promise<EventDetails | null> {
    const creator = await this.users.findOne({ where: { id: input.userId } });

    if (!creator) {
      return null;
    }

    const event = await this.events.save(
      this.events.create({
        title: input.title,
        description: input.description,
        startsAt: new Date(input.startsAt),
        location: input.location,
        createdByUserId: input.userId,
      }),
    );

    return this.getEventDetails(event.id);
  }

  async getEventDetails(eventId: string): Promise<EventDetails | null> {
    const event = await this.events.findOne({
      where: { id: eventId },
      relations: {
        createdBy: true,
        participants: {
          user: true,
        },
      },
    });

    if (!event) {
      return null;
    }

    return this.toEventDetails(event);
  }

  async joinEvent(eventId: string, userId: string): Promise<EventDetails | null> {
    const [event, user] = await Promise.all([
      this.events.findOne({ where: { id: eventId } }),
      this.users.findOne({ where: { id: userId } }),
    ]);

    if (!event || !user) {
      return null;
    }

    const existing = await this.participants.findOne({ where: { eventId, userId } });

    if (!existing) {
      try {
        await this.participants.save(this.participants.create({ eventId, userId }));
      } catch (error) {
        if (error instanceof QueryFailedError) {
          const pgError = error.driverError as { code?: string };
          if (pgError.code !== "23505") {
            throw error;
          }
        } else {
          throw error;
        }
      }
    }

    return this.getEventDetails(eventId);
  }

  async leaveEvent(eventId: string, userId: string): Promise<EventDetails | null> {
    const [event, user] = await Promise.all([
      this.events.findOne({ where: { id: eventId } }),
      this.users.findOne({ where: { id: userId } }),
    ]);

    if (!event || !user) {
      return null;
    }
    await this.participants.delete({ eventId, userId });
    return this.getEventDetails(eventId);
  }

  private toUser(user: UserEntity): User {
    return {
      id: user.id,
      name: user.name,
      createdAt: user.createdAt.toISOString(),
    };
  }

  private toEventDetails(event: EventEntity): EventDetails {
    const participants = [...event.participants]
      .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime())
      .map((participant) => this.toUser(participant.user));

    return {
      id: event.id,
      title: event.title,
      description: event.description,
      startsAt: event.startsAt.toISOString(),
      location: event.location,
      createdBy: this.toUser(event.createdBy),
      participantCount: participants.length,
      participants,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    };
  }
}
