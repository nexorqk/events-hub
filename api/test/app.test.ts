import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { createApp } from "../src/http/app";
import type {
  CreateEventInput,
  DemoUserResult,
  EventDetails,
  EventSummary,
  EventsRepository,
  User,
} from "../src/domain/eventsRepository";

class MemoryEventsRepository implements EventsRepository {
  private users: User[] = [];
  private events: EventDetails[] = [];

  async createOrFindDemoUser(name: string): Promise<DemoUserResult> {
    const normalizedName = name.trim();
    const existing = this.users.find((user) => user.name === normalizedName);

    if (existing) {
      return { user: existing, created: false };
    }

    const user: User = {
      id: randomUUID(),
      name: normalizedName,
      createdAt: new Date().toISOString(),
    };

    this.users.push(user);
    return { user, created: true };
  }

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
      createdBy: user,
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
      event.participants.push(user);
    }

    event.participantCount = event.participants.length;
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
    return event;
  }
}

test("demo users are created once by name", async (t) => {
  const app = await createApp({ eventsRepository: new MemoryEventsRepository() });
  t.after(async () => app.close());

  const firstResponse = await app.inject({
    method: "POST",
    url: "/users/demo",
    payload: { name: "Alex" },
  });
  const secondResponse = await app.inject({
    method: "POST",
    url: "/users/demo",
    payload: { name: "Alex" },
  });

  assert.equal(firstResponse.statusCode, 201);
  assert.equal(secondResponse.statusCode, 200);
  assert.equal(firstResponse.json().id, secondResponse.json().id);
});

test("events can be created, listed, joined, and left", async (t) => {
  const app = await createApp({ eventsRepository: new MemoryEventsRepository() });
  t.after(async () => app.close());

  const userResponse = await app.inject({
    method: "POST",
    url: "/users/demo",
    payload: { name: "Mira" },
  });
  const user = userResponse.json() as User;

  const createResponse = await app.inject({
    method: "POST",
    url: "/events",
    headers: { "x-user-id": user.id },
    payload: {
      title: "Community Picnic",
      description: "Food, games, and meeting neighbors.",
      startsAt: "2026-05-20T17:00:00.000Z",
      location: "Central Park",
    },
  });
  const createdEvent = createResponse.json() as EventDetails;

  assert.equal(createResponse.statusCode, 201);
  assert.equal(createdEvent.title, "Community Picnic");

  const listResponse = await app.inject({ method: "GET", url: "/events" });
  assert.equal(listResponse.statusCode, 200);
  assert.equal(listResponse.json()[0].participantCount, 0);

  const joinResponse = await app.inject({
    method: "POST",
    url: `/events/${createdEvent.id}/join`,
    headers: { "x-user-id": user.id },
  });
  assert.equal(joinResponse.statusCode, 200);
  assert.equal(joinResponse.json().participants.length, 1);

  const leaveResponse = await app.inject({
    method: "DELETE",
    url: `/events/${createdEvent.id}/join`,
    headers: { "x-user-id": user.id },
  });
  assert.equal(leaveResponse.statusCode, 200);
  assert.equal(leaveResponse.json().participants.length, 0);
});

test("creating an event requires a user header", async (t) => {
  const app = await createApp({ eventsRepository: new MemoryEventsRepository() });
  t.after(async () => app.close());

  const response = await app.inject({
    method: "POST",
    url: "/events",
    payload: {
      title: "No Owner Event",
      description: "This request is missing X-User-Id.",
      startsAt: "2026-05-20T17:00:00.000Z",
      location: "Nowhere",
    },
  });

  assert.equal(response.statusCode, 400);
  assert.equal(response.json().message, "X-User-Id header is required");
});

test("GET /events/:id returns 404 for missing event", async (t) => {
  const app = await createApp({ eventsRepository: new MemoryEventsRepository() });
  t.after(async () => app.close());

  const response = await app.inject({
    method: "GET",
    url: `/events/${randomUUID()}`,
  });

  assert.equal(response.statusCode, 404);
  assert.equal(response.json().message, "Event not found");
});

test("POST /events returns 404 for non-existent user", async (t) => {
  const app = await createApp({ eventsRepository: new MemoryEventsRepository() });
  t.after(async () => app.close());

  const response = await app.inject({
    method: "POST",
    url: "/events",
    headers: { "x-user-id": randomUUID() },
    payload: {
      title: "Orphan Event",
      description: "User does not exist.",
      startsAt: "2026-05-20T17:00:00.000Z",
      location: "Void",
    },
  });

  assert.equal(response.statusCode, 404);
  assert.equal(response.json().message, "User not found");
});

test("POST /events/:id/join returns 404 for missing event or user", async (t) => {
  const app = await createApp({ eventsRepository: new MemoryEventsRepository() });
  t.after(async () => app.close());

  const userResponse = await app.inject({
    method: "POST",
    url: "/users/demo",
    payload: { name: "Jordan" },
  });
  const user = userResponse.json() as User;

  const missingEventResponse = await app.inject({
    method: "POST",
    url: `/events/${randomUUID()}/join`,
    headers: { "x-user-id": user.id },
  });
  assert.equal(missingEventResponse.statusCode, 404);
  assert.equal(missingEventResponse.json().message, "Event or user not found");

  const createResponse = await app.inject({
    method: "POST",
    url: "/events",
    headers: { "x-user-id": user.id },
    payload: {
      title: "Solo Event",
      description: "Only one user.",
      startsAt: "2026-05-20T17:00:00.000Z",
      location: "Home",
    },
  });
  const event = createResponse.json() as EventDetails;

  const missingUserResponse = await app.inject({
    method: "POST",
    url: `/events/${event.id}/join`,
    headers: { "x-user-id": randomUUID() },
  });
  assert.equal(missingUserResponse.statusCode, 404);
  assert.equal(missingUserResponse.json().message, "Event or user not found");
});

test("DELETE /events/:id/join returns 404 for missing event or user", async (t) => {
  const app = await createApp({ eventsRepository: new MemoryEventsRepository() });
  t.after(async () => app.close());

  const userResponse = await app.inject({
    method: "POST",
    url: "/users/demo",
    payload: { name: "Taylor" },
  });
  const user = userResponse.json() as User;

  const missingEventResponse = await app.inject({
    method: "DELETE",
    url: `/events/${randomUUID()}/join`,
    headers: { "x-user-id": user.id },
  });
  assert.equal(missingEventResponse.statusCode, 404);
  assert.equal(missingEventResponse.json().message, "Event or user not found");

  const createResponse = await app.inject({
    method: "POST",
    url: "/events",
    headers: { "x-user-id": user.id },
    payload: {
      title: "Leave Event",
      description: "Testing leave 404s.",
      startsAt: "2026-05-20T17:00:00.000Z",
      location: "Park",
    },
  });
  const event = createResponse.json() as EventDetails;

  const missingUserResponse = await app.inject({
    method: "DELETE",
    url: `/events/${event.id}/join`,
    headers: { "x-user-id": randomUUID() },
  });
  assert.equal(missingUserResponse.statusCode, 404);
  assert.equal(missingUserResponse.json().message, "Event or user not found");
});

test("duplicate join is idempotent", async (t) => {
  const app = await createApp({ eventsRepository: new MemoryEventsRepository() });
  t.after(async () => app.close());

  const userResponse = await app.inject({
    method: "POST",
    url: "/users/demo",
    payload: { name: "Casey" },
  });
  const user = userResponse.json() as User;

  const createResponse = await app.inject({
    method: "POST",
    url: "/events",
    headers: { "x-user-id": user.id },
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
    headers: { "x-user-id": user.id },
  });
  assert.equal(firstJoin.statusCode, 200);
  assert.equal(firstJoin.json().participants.length, 1);
  assert.equal(firstJoin.json().participantCount, 1);

  const secondJoin = await app.inject({
    method: "POST",
    url: `/events/${event.id}/join`,
    headers: { "x-user-id": user.id },
  });
  assert.equal(secondJoin.statusCode, 200);
  assert.equal(secondJoin.json().participants.length, 1);
  assert.equal(secondJoin.json().participantCount, 1);
});
