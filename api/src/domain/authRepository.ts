export type { AuthUser, User } from "./models";
import type { AuthUser, User } from "./models";

export type CreateAuthUserInput = {
  name: string;
  passwordHash: string;
};

export type AuthRepository = {
  createUserWithPassword(input: CreateAuthUserInput): Promise<User | null>;
  findUserByNameWithPassword(name: string): Promise<AuthUser | null>;
  findUserById(userId: string): Promise<User | null>;
};
