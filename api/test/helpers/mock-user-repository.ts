import { mock } from "node:test";
import type { TypeOrmUserRepository } from "../../src/db/typeormUserRepository";
import { fakeUser } from "./mock-events-repository";

export function createMockUserRepository(
  overrides: Partial<TypeOrmUserRepository> = {},
): TypeOrmUserRepository {
  return {
    findOrCreateDemoUser: mock.fn(() => Promise.resolve(fakeUser)),
    findOrCreateGoogleUser: mock.fn(() => Promise.resolve(fakeUser)),
    findById: mock.fn((_userId: string) => Promise.resolve(fakeUser)),
    ...overrides,
  } as TypeOrmUserRepository;
}
