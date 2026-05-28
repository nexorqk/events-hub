import { createApp } from "../../src/http/app";
import { createMockEventsRepository, fakeUser } from "./mock-events-repository";
import type { EventsRepository } from "../../src/domain/eventsRepository";
import { createMockUserRepository } from "./mock-user-repository";
import type { TypeOrmUserRepository } from "../../src/db/typeormUserRepository";

type TestAppResult = {
  app: Awaited<ReturnType<typeof createApp>>;
  eventsRepo: EventsRepository;
  userRepo: TypeOrmUserRepository;
  makeAuthHeader: (userId?: string) => { Authorization: string };
};

export async function createTestApp(overrides?: {
  eventsRepo?: Partial<EventsRepository>;
  userRepo?: Partial<TypeOrmUserRepository>;
}): Promise<TestAppResult> {
  const eventsRepo = createMockEventsRepository(overrides?.eventsRepo);
  const userRepo = createMockUserRepository(overrides?.userRepo);

  const app = await createApp({
    userRepository: userRepo,
    eventsRepository: eventsRepo,
  });

  function makeAuthHeader(userId = fakeUser.id): { Authorization: string } {
    const token = app.jwt.sign({ sub: userId }, { expiresIn: "1h" });
    return { Authorization: `Bearer ${token}` };
  }

  return { app, eventsRepo, userRepo, makeAuthHeader };
}
