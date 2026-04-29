import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import type { AuthRepository, AuthUser, CreateAuthUserInput, User } from "../src/domain/authRepository";
import type { CreateEventInput, EventDetails, EventSummary, EventsRepository } from "../src/domain/eventsRepository";
import type { AuthSession } from "../src/domain/models";
import { createApp } from "../src/http/app";

function toUser(user: AuthUser): User {
  return {
    id: user.id,
    name: user.name,
    createdAt: user.createdAt,
  };
}

class MemoryAuthRepository implements AuthRepository {
  constructor(private readonly users: AuthUser[]) {}

  async createUserWithPassword(input: CreateAuthUserInput): Promise<User | null> {
    const normalizedName = input.name.trim();

    if (this.users.some((user) => user.name === normalizedName)) {
      return null;
    }

    const user: AuthUser = {
      id: randomUUID(),
      name: normalizedName,
      passwordHash: input.passwordHash,
      createdAt: new Date().toISOString(),
    };

    this.users.push(user);
    return toUser(user);
  }

  async findUserByNameWithPassword(name: string): Promise<AuthUser | null> {
    return this.users.find((user) => user.name === name.trim()) ?? null;
  }

  async findUserById(userId: string): Promise<User | null> {
    const user = this.users.find((candidate) => candidate.id === userId);
    return user ? toUser(user) : null;
  }
}

class MemoryEventsRepository implements EventsRepository {
  constructor(
    private readonly users: AuthUser[],
    private readonly events: EventDetails[],
  ) {}

  async listEvents(): Promise<EventSummary[]> {
    return this.events.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      startsAt: event.startsAt,
      location: event.location,
      createdBy: event.createdBy,
      participantCount: event.participants.length,
    }));
  }

  async createEvent(input: CreateEventInput): Promise<EventDetails | null> {
    const user = this.users.find((candidate) => candidate.id === input.userId);

    if (!user) {
      return null;
    }

    const event: EventDetails = {
      id: randomUUID(),
      title: input.title,
      description: input.description,
      startsAt: input.startsAt,
      location: input.location,
      createdBy: toUser(user),
      participants: [],
      participantCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.events.push(event);
    return event;
  }

  async getEventDetails(eventId: string): Promise<EventDetails | null> {
    return this.events.find((event) => event.id === eventId) ?? null;
  }

  async joinEvent(eventId: string, userId: string): Promise<EventDetails | null> {
    const event = this.events.find((candidate) => candidate.id === eventId);
    const user = this.users.find((candidate) => candidate.id === userId);

    if (!event || !user) {
      return null;
    }

    if (!event.participants.some((participant) => participant.id === user.id)) {
      event.participants.push(toUser(user));
    }

    event.participantCount = event.participants.length;
    event.updatedAt = new Date().toISOString();
    return event;
  }

  async leaveEvent(eventId: string, userId: string): Promise<EventDetails | null> {
    const event = this.events.find((candidate) => candidate.id === eventId);
    const user = this.users.find((candidate) => candidate.id === userId);

    if (!event || !user) {
      return null;
    }

    event.participants = event.participants.filter((participant) => participant.id !== user.id);
    event.participantCount = event.participants.length;
    event.updatedAt = new Date().toISOString();
    return event;
  }
}

async function createTestApp() {
  const users: AuthUser[] = [];
  const events: EventDetails[] = [];

  return createApp({
    authRepository: new MemoryAuthRepository(users),
    eventsRepository: new MemoryEventsRepository(users, events),
  });
}

async function registerUser(app: Awaited<ReturnType<typeof createTestApp>>, name = "Alex") {
  const response = await app.inject({
    method: "POST",
    url: "/auth/register",
    payload: { name, password: "password-123" },
  });

  assert.equal(response.statusCode, 201);
  return response.json() as AuthSession;
}

test("users can register and duplicate names are rejected", async (t) => {
  const app = await createTestApp();
  t.after(async () => app.close());

  const firstResponse = await app.inject({
    method: "POST",
    url: "/auth/register",
    payload: { name: "Alex", password: "password-123" },
  });
  const duplicateResponse = await app.inject({
    method: "POST",
    url: "/auth/register",
    payload: { name: "Alex", password: "password-123" },
  });

  const session = firstResponse.json() as AuthSession;

  assert.equal(firstResponse.statusCode, 201);
  assert.equal(typeof session.token, "string");
  assert.equal(session.user.name, "Alex");
  assert.equal(duplicateResponse.statusCode, 409);
  assert.equal(duplicateResponse.json().message, "Name is already registered");
});

test("users can log in with password", async (t) => {
  const app = await createTestApp();
  t.after(async () => app.close());

  const registered = await registerUser(app, "Mira");
  const loginResponse = await app.inject({
    method: "POST",
    url: "/auth/login",
    payload: { name: "Mira", password: "password-123" },
  });
  const badPasswordResponse = await app.inject({
    method: "POST",
    url: "/auth/login",
    payload: { name: "Mira", password: "wrong-password" },
  });

  assert.equal(loginResponse.statusCode, 200);
  assert.equal((loginResponse.json() as AuthSession).user.id, registered.user.id);
  assert.equal(badPasswordResponse.statusCode, 401);
  assert.equal(badPasswordResponse.json().message, "Invalid name or password");
});

test("auth/me returns the current user for a bearer token", async (t) => {
  const app = await createTestApp();
  t.after(async () => app.close());
  const session = await registerUser(app, "Nora");

  const response = await app.inject({
    method: "GET",
    url: "/auth/me",
    headers: { authorization: `Bearer ${session.token}` },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json().id, session.user.id);
});

test("events can be created, listed, joined, and left with auth", async (t) => {
  const app = await createTestApp();
  t.after(async () => app.close());
  const session = await registerUser(app, "Jordan");
  const authHeaders = { authorization: `Bearer ${session.token}` };

  const createResponse = await app.inject({
    method: "POST",
    url: "/events",
    headers: authHeaders,
    payload: {
      title: "Community Picnic",
      description: "Food, games, and meeting neighbors.",
      startsAt: "2026-05-20T17:00:00.000Z",
      location: "Central Park",
    },
  });
  const createdEvent = createResponse.json() as EventDetails;

  assert.equal(createResponse.statusCode, 201);
  assert.equal(createdEvent.createdBy.id, session.user.id);

  const listResponse = await app.inject({ method: "GET", url: "/events" });
  assert.equal(listResponse.statusCode, 200);
  assert.equal(listResponse.json()[0].participantCount, 0);

  const joinResponse = await app.inject({
    method: "POST",
    url: `/events/${createdEvent.id}/join`,
    headers: authHeaders,
  });
  assert.equal(joinResponse.statusCode, 200);
  assert.equal(joinResponse.json().participants.length, 1);

  const leaveResponse = await app.inject({
    method: "DELETE",
    url: `/events/${createdEvent.id}/join`,
    headers: authHeaders,
  });
  assert.equal(leaveResponse.statusCode, 200);
  assert.equal(leaveResponse.json().participants.length, 0);
});

test("creating an event requires authentication", async (t) => {
  const app = await createTestApp();
  t.after(async () => app.close());

  const response = await app.inject({
    method: "POST",
    url: "/events",
    payload: {
      title: "No Owner Event",
      description: "This request is missing auth.",
      startsAt: "2026-05-20T17:00:00.000Z",
      location: "Nowhere",
    },
  });

  assert.equal(response.statusCode, 401);
  assert.equal(response.json().message, "Authentication required");
});

test("GET /events/:id returns 404 for missing event", async (t) => {
  const app = await createTestApp();
  t.after(async () => app.close());

  const response = await app.inject({
    method: "GET",
    url: `/events/${randomUUID()}`,
  });

  assert.equal(response.statusCode, 404);
  assert.equal(response.json().message, "Event not found");
});

test("POST /events/:id/join returns 404 for missing event", async (t) => {
  const app = await createTestApp();
  t.after(async () => app.close());
  const session = await registerUser(app, "Taylor");

  const response = await app.inject({
    method: "POST",
    url: `/events/${randomUUID()}/join`,
    headers: { authorization: `Bearer ${session.token}` },
  });

  assert.equal(response.statusCode, 404);
  assert.equal(response.json().message, "Event or user not found");
});

test("DELETE /events/:id/join returns 404 for missing event", async (t) => {
  const app = await createTestApp();
  t.after(async () => app.close());
  const session = await registerUser(app, "Sam");

  const response = await app.inject({
    method: "DELETE",
    url: `/events/${randomUUID()}/join`,
    headers: { authorization: `Bearer ${session.token}` },
  });

  assert.equal(response.statusCode, 404);
  assert.equal(response.json().message, "Event or user not found");
});

test("duplicate join is idempotent", async (t) => {
  const app = await createTestApp();
  t.after(async () => app.close());
  const session = await registerUser(app, "Casey");
  const authHeaders = { authorization: `Bearer ${session.token}` };

  const createResponse = await app.inject({
    method: "POST",
    url: "/events",
    headers: authHeaders,
    payload: {
      title: "Club Meeting",
      description: "Membership test.",
      startsAt: "2026-05-20T17:00:00.000Z",
      location: "Hall",
    },
  });
  const event = createResponse.json() as EventDetails;

  const firstJoin = await app.inject({
    method: "POST",
    url: `/events/${event.id}/join`,
    headers: authHeaders,
  });
  assert.equal(firstJoin.statusCode, 200);
  assert.equal(firstJoin.json().participants.length, 1);
  assert.equal(firstJoin.json().participantCount, 1);

  const secondJoin = await app.inject({
    method: "POST",
    url: `/events/${event.id}/join`,
    headers: authHeaders,
  });
  assert.equal(secondJoin.statusCode, 200);
  assert.equal(secondJoin.json().participants.length, 1);
  assert.equal(secondJoin.json().participantCount, 1);
});
