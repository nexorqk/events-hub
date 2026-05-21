import { QueryFailedError, type DataSource, type Repository } from "typeorm";
import type { User } from "../domain/models";
import { UserEntity } from "./entities/user.entity";

export type CreateDemoUserInput = {
  name: string;
};

export type CreateGoogleUserInput = {
  googleId: string;
  name: string;
  email?: string;
  avatarUrl?: string;
};

export class TypeOrmUserRepository {
  private readonly users: Repository<UserEntity>;

  constructor(dataSource: DataSource) {
    this.users = dataSource.getRepository(UserEntity);
  }

  async findOrCreateDemoUser(input: CreateDemoUserInput): Promise<User> {
    const normalizedName = input.name.trim();
    const existing = await this.users.findOne({ where: { name: normalizedName, googleId: null as unknown as undefined } });

    if (existing) {
      return this.toUser(existing);
    }

    try {
      const user = await this.users.save(this.users.create({ name: normalizedName }));
      return this.toUser(user);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const pgError = error.driverError as { code?: string };
        if (pgError.code === "23505") {
          const user = await this.users.findOne({ where: { name: normalizedName } });
          if (user) {
            return this.toUser(user);
          }
        }
      }
      throw error;
    }
  }

  async findOrCreateGoogleUser(input: CreateGoogleUserInput): Promise<User> {
    const existing = await this.users.findOne({ where: { googleId: input.googleId } });

    if (existing) {
      return this.toUser(existing);
    }

    try {
      const user = await this.users.save(
        this.users.create({
          name: input.name,
          googleId: input.googleId,
          email: input.email ?? null,
          avatarUrl: input.avatarUrl ?? null,
        }),
      );
      return this.toUser(user);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const pgError = error.driverError as { code?: string };
        if (pgError.code === "23505") {
          const user = await this.users.findOne({ where: { googleId: input.googleId } });
          if (user) {
            return this.toUser(user);
          }
        }
      }
      throw error;
    }
  }

  async findById(userId: string): Promise<User | null> {
    const user = await this.users.findOne({ where: { id: userId } });
    return user ? this.toUser(user) : null;
  }

  private toUser(user: UserEntity): User {
    return {
      id: user.id,
      name: user.name,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
