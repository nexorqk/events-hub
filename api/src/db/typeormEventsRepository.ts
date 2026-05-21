import { QueryFailedError, type DataSource, type Repository } from "typeorm";
import type {
  CreateCommentInput,
  CreateEventInput,
  EventComment,
  EventDetails,
  EventSummary,
  EventsRepository,
  RsvpStatus,
  UpdateEventInput,
  UpdateEventResult,
  User,
} from "../domain/eventsRepository";
import { EventCommentEntity } from "./entities/event-comment.entity";
import { EventRsvpEntity } from "./entities/event-rsvp.entity";
import { EventEntity } from "./entities/event.entity";
import { UserEntity } from "./entities/user.entity";

export class TypeOrmEventsRepository implements EventsRepository {
  private readonly users: Repository<UserEntity>;
  private readonly events: Repository<EventEntity>;
  private readonly rsvps: Repository<EventRsvpEntity>;
  private readonly comments: Repository<EventCommentEntity>;

  constructor(dataSource: DataSource) {
    this.users = dataSource.getRepository(UserEntity);
    this.events = dataSource.getRepository(EventEntity);
    this.rsvps = dataSource.getRepository(EventRsvpEntity);
    this.comments = dataSource.getRepository(EventCommentEntity);
  }

  async listEvents(): Promise<EventSummary[]> {
    const rows = await this.events
      .createQueryBuilder("event")
      .leftJoin("event.createdBy", "createdBy")
      .leftJoin("event.rsvps", "rsvp")
      .select("event.id", "id")
      .addSelect("event.title", "title")
      .addSelect("event.description", "description")
      .addSelect("event.startsAt", "startsAt")
      .addSelect("event.location", "location")
      .addSelect("createdBy.id", "createdById")
      .addSelect("createdBy.name", "createdByName")
      .addSelect("createdBy.createdAt", "createdByCreatedAt")
      .addSelect("COUNT(rsvp.userId) FILTER (WHERE rsvp.status = 'going')", "participantCount")
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

  async updateEvent(input: UpdateEventInput): Promise<UpdateEventResult> {
    const event = await this.events.findOne({ where: { id: input.eventId } });

    if (!event) {
      return { status: "not_found" };
    }

    if (event.createdByUserId !== input.userId) {
      return { status: "forbidden" };
    }

    event.title = input.title;
    event.description = input.description;
    event.startsAt = new Date(input.startsAt);
    event.location = input.location;

    await this.events.save(event);

    const updatedEvent = await this.getEventDetails(event.id);

    if (!updatedEvent) {
      return { status: "not_found" };
    }

    return { status: "updated", event: updatedEvent };
  }

  async getEventDetails(eventId: string): Promise<EventDetails | null> {
    const event = await this.events.findOne({
      where: { id: eventId },
      relations: {
        createdBy: true,
        rsvps: {
          user: true,
        },
        comments: {
          user: true,
        },
      },
    });

    if (!event) {
      return null;
    }

    return this.toEventDetails(event);
  }

  async setRsvp(eventId: string, userId: string, status: RsvpStatus): Promise<EventDetails | null> {
    const [event, user] = await Promise.all([
      this.events.findOne({ where: { id: eventId } }),
      this.users.findOne({ where: { id: userId } }),
    ]);

    if (!event || !user) {
      return null;
    }

    const existing = await this.rsvps.findOne({ where: { eventId, userId } });

    if (existing) {
      existing.status = status;
      await this.rsvps.save(existing);
    } else {
      try {
        await this.rsvps.save(this.rsvps.create({ eventId, userId, status }));
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

  async removeRsvp(eventId: string, userId: string): Promise<EventDetails | null> {
    const [event, user] = await Promise.all([
      this.events.findOne({ where: { id: eventId } }),
      this.users.findOne({ where: { id: userId } }),
    ]);

    if (!event || !user) {
      return null;
    }

    await this.rsvps.delete({ eventId, userId });
    return this.getEventDetails(eventId);
  }

  async listComments(eventId: string): Promise<EventComment[]> {
    const rows = await this.comments.find({
      where: { eventId },
      relations: { user: true },
      order: { createdAt: "ASC" },
    });

    return rows.map((row) => ({
      id: row.id,
      eventId: row.eventId,
      user: this.toUser(row.user),
      content: row.content,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async createComment(input: CreateCommentInput): Promise<EventComment | null> {
    const [event, user] = await Promise.all([
      this.events.findOne({ where: { id: input.eventId } }),
      this.users.findOne({ where: { id: input.userId } }),
    ]);

    if (!event || !user) {
      return null;
    }

    const comment = await this.comments.save(
      this.comments.create({
        eventId: input.eventId,
        userId: input.userId,
        content: input.content.trim(),
      }),
    );

    return {
      id: comment.id,
      eventId: comment.eventId,
      user: this.toUser(user),
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
    };
  }

  async deleteComment(commentId: string, userId: string): Promise<boolean> {
    const comment = await this.comments.findOne({
      where: { id: commentId },
      relations: { event: { createdBy: true } },
    });

    if (!comment) {
      return false;
    }

    const isAuthor = comment.userId === userId;
    const isHost = comment.event.createdBy.id === userId;

    if (!isAuthor && !isHost) {
      return false;
    }

    await this.comments.delete({ id: commentId });
    return true;
  }

  private toUser(user: UserEntity): User {
    return {
      id: user.id,
      name: user.name,
      createdAt: user.createdAt.toISOString(),
    };
  }

  private toEventDetails(event: EventEntity): EventDetails {
    const rsvpUsers = [...event.rsvps]
      .sort((left, right) => left.respondedAt.getTime() - right.respondedAt.getTime())
      .map((rsvp) => ({
        user: this.toUser(rsvp.user),
        status: rsvp.status as RsvpStatus,
        respondedAt: rsvp.respondedAt.toISOString(),
      }));

    const participants = rsvpUsers
      .filter((r) => r.status === "going")
      .map((r) => r.user);

    const commentList = [...event.comments]
      .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime())
      .map((comment) => ({
        id: comment.id,
        eventId: comment.eventId,
        user: this.toUser(comment.user),
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
      }));

    return {
      id: event.id,
      title: event.title,
      description: event.description,
      startsAt: event.startsAt.toISOString(),
      location: event.location,
      createdBy: this.toUser(event.createdBy),
      participantCount: participants.length,
      participants,
      rsvps: rsvpUsers,
      comments: commentList,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    };
  }
}
