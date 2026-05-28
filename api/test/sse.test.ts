import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createEventBus } from "../src/http/event-bus";
import { createMockEventsRepository, fakeComment, fakeEventDetails, fakeEventSummary } from "./helpers/mock-events-repository";
import { createMockUserRepository } from "./helpers/mock-user-repository";
import { createApp } from "../src/http/app";

describe("Event Bus", () => {
  it("delivers events to subscribers", () => {
    const eventBus = createEventBus();
    const received: Array<{ type: string; data: unknown }> = [];
    const unsubscribe = eventBus.subscribe((event) => {
      received.push({ type: event.type, data: event.data });
    });

    eventBus.emit({ type: "event:created", data: fakeEventSummary });
    eventBus.emit({ type: "rsvp:changed", data: fakeEventDetails });
    eventBus.emit({ type: "comment:added", data: fakeEventDetails });
    eventBus.emit({ type: "comment:deleted", data: fakeEventDetails });

    assert.equal(received.length, 4);
    assert.equal(received[0].type, "event:created");
    assert.equal(received[1].type, "rsvp:changed");
    assert.equal(received[2].type, "comment:added");
    assert.equal(received[3].type, "comment:deleted");

    unsubscribe();
  });

  it("unsubscribes correctly", () => {
    const eventBus = createEventBus();
    let callCount = 0;
    const unsubscribe = eventBus.subscribe(() => {
      callCount++;
    });

    eventBus.emit({ type: "event:created", data: fakeEventSummary });
    assert.equal(callCount, 1);

    unsubscribe();
    eventBus.emit({ type: "event:created", data: fakeEventSummary });
    assert.equal(callCount, 1);
  });

  it("supports multiple subscribers", () => {
    const eventBus = createEventBus();
    let countA = 0;
    let countB = 0;

    const unsubA = eventBus.subscribe(() => { countA++; });
    const unsubB = eventBus.subscribe(() => { countB++; });

    eventBus.emit({ type: "event:created", data: fakeEventSummary });

    assert.equal(countA, 1);
    assert.equal(countB, 1);

    unsubA();
    unsubB();
  });
});

describe("SSE route handler integration", () => {
  it("broadcasts event:created when event is created", async () => {
    const received: Array<{ type: string; data: unknown }> = [];
    const app = await createApp({
      userRepository: createMockUserRepository(),
      eventsRepository: createMockEventsRepository(),
      eventBus: {
        emit: (event) => received.push({ type: event.type, data: event.data }),
        subscribe: () => () => {},
      },
    });

    const token = app.jwt.sign({ sub: fakeEventDetails.createdBy.id }, { expiresIn: "1h" });
    await app.inject({
      method: "POST",
      url: "/events",
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        title: "New Event",
        startsAt: "2026-07-01T18:00:00.000Z",
        description: "desc",
        location: "loc",
      },
    });

    assert.equal(received.length, 1);
    assert.equal(received[0].type, "event:created");
    await app.close();
  });

  it("broadcasts rsvp:changed when RSVP is set", async () => {
    const received: Array<{ type: string; data: unknown }> = [];
    const app = await createApp({
      userRepository: createMockUserRepository(),
      eventsRepository: createMockEventsRepository(),
      eventBus: {
        emit: (event) => received.push({ type: event.type, data: event.data }),
        subscribe: () => () => {},
      },
    });

    const token = app.jwt.sign({ sub: fakeEventDetails.createdBy.id }, { expiresIn: "1h" });
    await app.inject({
      method: "POST",
      url: `/events/${fakeEventSummary.id}/rsvp`,
      headers: { Authorization: `Bearer ${token}` },
      payload: { status: "going" },
    });

    assert.equal(received.length, 1);
    assert.equal(received[0].type, "rsvp:changed");
    await app.close();
  });

  it("broadcasts rsvp:changed when RSVP is removed", async () => {
    const received: Array<{ type: string; data: unknown }> = [];
    const app = await createApp({
      userRepository: createMockUserRepository(),
      eventsRepository: createMockEventsRepository(),
      eventBus: {
        emit: (event) => received.push({ type: event.type, data: event.data }),
        subscribe: () => () => {},
      },
    });

    const token = app.jwt.sign({ sub: fakeEventDetails.createdBy.id }, { expiresIn: "1h" });
    await app.inject({
      method: "DELETE",
      url: `/events/${fakeEventSummary.id}/rsvp`,
      headers: { Authorization: `Bearer ${token}` },
    });

    assert.equal(received.length, 1);
    assert.equal(received[0].type, "rsvp:changed");
    await app.close();
  });

  it("broadcasts comment:added when comment is created", async () => {
    const received: Array<{ type: string; data: unknown }> = [];
    const app = await createApp({
      userRepository: createMockUserRepository(),
      eventsRepository: createMockEventsRepository({
        createComment: () => Promise.resolve(fakeComment),
        getEventDetails: () => Promise.resolve(fakeEventDetails),
      }),
      eventBus: {
        emit: (event) => received.push({ type: event.type, data: event.data }),
        subscribe: () => () => {},
      },
    });

    const token = app.jwt.sign({ sub: fakeEventDetails.createdBy.id }, { expiresIn: "1h" });
    await app.inject({
      method: "POST",
      url: `/events/${fakeEventSummary.id}/comments`,
      headers: { Authorization: `Bearer ${token}` },
      payload: { content: "test" },
    });

    assert.equal(received.length, 1);
    assert.equal(received[0].type, "comment:added");
    await app.close();
  });

  it("broadcasts comment:deleted when comment is deleted", async () => {
    const received: Array<{ type: string; data: unknown }> = [];
    const app = await createApp({
      userRepository: createMockUserRepository(),
      eventsRepository: createMockEventsRepository({
        deleteComment: () => Promise.resolve(true),
        getEventDetails: () => Promise.resolve(fakeEventDetails),
      }),
      eventBus: {
        emit: (event) => received.push({ type: event.type, data: event.data }),
        subscribe: () => () => {},
      },
    });

    const token = app.jwt.sign({ sub: fakeEventDetails.createdBy.id }, { expiresIn: "1h" });
    await app.inject({
      method: "DELETE",
      url: `/events/${fakeEventSummary.id}/comments/${fakeComment.id}`,
      headers: { Authorization: `Bearer ${token}` },
    });

    assert.equal(received.length, 1);
    assert.equal(received[0].type, "comment:deleted");
    await app.close();
  });

  it("broadcasts event:deleted when event is deleted", async () => {
    const received: Array<{ type: string; data: unknown }> = [];
    const app = await createApp({
      userRepository: createMockUserRepository(),
      eventsRepository: createMockEventsRepository({
        deleteEvent: () => Promise.resolve("deleted" as const),
      }),
      eventBus: {
        emit: (event) => received.push({ type: event.type, data: event.data }),
        subscribe: () => () => {},
      },
    });

    const token = app.jwt.sign({ sub: fakeEventDetails.createdBy.id }, { expiresIn: "1h" });
    await app.inject({
      method: "DELETE",
      url: `/events/${fakeEventSummary.id}`,
      headers: { Authorization: `Bearer ${token}` },
    });

    assert.equal(received.length, 1);
    assert.equal(received[0].type, "event:deleted");
    await app.close();
  });

  it("does not emit when eventBus is not provided", async () => {
    const app = await createApp({
      userRepository: createMockUserRepository(),
      eventsRepository: createMockEventsRepository(),
    });

    const token = app.jwt.sign({ sub: fakeEventDetails.createdBy.id }, { expiresIn: "1h" });
    const res = await app.inject({
      method: "POST",
      url: "/events",
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        title: "New Event",
        startsAt: "2026-07-01T18:00:00.000Z",
        description: "desc",
        location: "loc",
      },
    });

    assert.equal(res.statusCode, 201);
    await app.close();
  });
});
