import { QueryFailedError, type DataSource, type Repository } from "typeorm";
import type {
  AuthRepository,
  AuthUser,
  CreateAuthUserInput,
  User,
} from "../domain/authRepository";
import { UserEntity } from "./entities/user.entity";

const LEGACY_PASSWORD_DISABLED = "legacy-password-disabled";

export class TypeOrmAuthRepository implements AuthRepository {
  private readonly users: Repository<UserEntity>;

  constructor(dataSource: DataSource) {
    this.users = dataSource.getRepository(UserEntity);
  }

  async createUserWithPassword(input: CreateAuthUserInput): Promise<User | null> {
    const normalizedName = input.name.trim();
    const existing = await this.findUserEntityByNameWithPassword(normalizedName);

    if (existing) {
      if (existing.passwordHash === LEGACY_PASSWORD_DISABLED) {
        existing.passwordHash = input.passwordHash;
        const user = await this.users.save(existing);
        return this.toUser(user);
      }

      return null;
    }

    try {
      const user = await this.users.save(
        this.users.create({
          name: normalizedName,
          passwordHash: input.passwordHash,
        }),
      );

      return this.toUser(user);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const pgError = error.driverError as { code?: string };
        if (pgError.code === "23505") {
          const user = await this.findUserEntityByNameWithPassword(normalizedName);

          if (user?.passwordHash === LEGACY_PASSWORD_DISABLED) {
            user.passwordHash = input.passwordHash;
            const claimedUser = await this.users.save(user);
            return this.toUser(claimedUser);
          }

          return null;
        }
      }

      throw error;
    }
  }

  async findUserByNameWithPassword(name: string): Promise<AuthUser | null> {
    const user = await this.findUserEntityByNameWithPassword(name.trim());

    if (!user) {
      return null;
    }

    return {
      ...this.toUser(user),
      passwordHash: user.passwordHash,
    };
  }

  async findUserById(userId: string): Promise<User | null> {
    const user = await this.users.findOne({ where: { id: userId } });
    return user ? this.toUser(user) : null;
  }

  private findUserEntityByNameWithPassword(name: string): Promise<UserEntity | null> {
    return this.users
      .createQueryBuilder("user")
      .addSelect("user.passwordHash")
      .where("user.name = :name", { name })
      .getOne();
  }

  private toUser(user: UserEntity): User {
    return {
      id: user.id,
      name: user.name,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
