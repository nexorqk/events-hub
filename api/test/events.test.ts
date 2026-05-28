import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { createTestApp } from "./helpers/create-test-app";
import { fakeEventDetails, fakeEventSummary } from "./helpers/mock-events-repository";

describe("Event CRUD routes", () => {
  describe("GET /events", () => {
    it("returns event list", async () => {
      const { app } = await createTestApp();
      const res = await app.inject({ method: "GET", url: "/events" });

      assert.equal(res.statusCode, 200);
      const body = res.json();
      assert.ok(Array.isArray(body));
      assert.equal(body.length, 1);
      assert.equal(body[0].id, fakeEventSummary.id);
    });

    it("returns empty array when no events", async () => {
      const { app } = await createTestApp({ eventsRepo: { listEvents: () => Promise.resolve([]) } });
      const res = await app.inject({ method: "GET", url: "/events" });

      assert.equal(res.statusCode, 200);
      assert.deepEqual(res.json(), []);
    });
  });

  describe("POST /events", () => {
    it("creates event and returns 201", async () => {
      const { app, makeAuthHeader } = await createTestApp();
      const res = await app.inject({
        method: "POST",
        url: "/events",
        headers: makeAuthHeader(),
        payload: {
          title: "New Event",
          startsAt: "2026-07-01T18:00:00.000Z",
          description: "desc",
          location: "loc",
        },
      });

      assert.equal(res.statusCode, 201);
      assert.equal(res.json().id, fakeEventDetails.id);
    });

    it("returns 400 without title", async () => {
      const { app, makeAuthHeader } = await createTestApp();
      const res = await app.inject({
        method: "POST",
        url: "/events",
        headers: makeAuthHeader(),
        payload: { startsAt: "2026-07-01T18:00:00.000Z" },
      });

      assert.equal(res.statusCode, 400);
      assert.match(res.json().message, /title/i);
    });

    it("returns 400 without startsAt", async () => {
      const { app, makeAuthHeader } = await createTestApp();
      const res = await app.inject({
        method: "POST",
        url: "/events",
        headers: makeAuthHeader(),
        payload: { title: "Event" },
      });

      assert.equal(res.statusCode, 400);
      assert.match(res.json().message, /date/i);
    });

    it("returns 401 without auth", async () => {
      const { app } = await createTestApp();
      const res = await app.inject({
        method: "POST",
        url: "/events",
        payload: { title: "Event", startsAt: "2026-07-01T18:00:00.000Z" },
      });

      assert.equal(res.statusCode, 401);
    });
  });

  describe("PATCH /events/:id", () => {
    it("updates event", async () => {
      const { app, makeAuthHeader } = await createTestApp();
      const res = await app.inject({
        method: "PATCH",
        url: `/events/${fakeEventDetails.id}`,
        headers: makeAuthHeader(),
        payload: {
          title: "Updated",
          startsAt: "2026-07-01T18:00:00.000Z",
          description: "d",
          location: "l",
        },
      });

      assert.equal(res.statusCode, 200);
    });

    it("returns 404 when event not found", async () => {
      const { app, makeAuthHeader } = await createTestApp({
        eventsRepo: {
          updateEvent: () => Promise.resolve({ status: "not_found" as const }),
        },
      });
      const res = await app.inject({
        method: "PATCH",
        url: `/events/${fakeEventDetails.id}`,
        headers: makeAuthHeader(),
        payload: {
          title: "Updated",
          startsAt: "2026-07-01T18:00:00.000Z",
          description: "d",
          location: "l",
        },
      });

      assert.equal(res.statusCode, 404);
    });

    it("returns 403 when not owner", async () => {
      const { app, makeAuthHeader } = await createTestApp({
        eventsRepo: {
          updateEvent: () => Promise.resolve({ status: "forbidden" as const }),
        },
      });
      const res = await app.inject({
        method: "PATCH",
        url: `/events/${fakeEventDetails.id}`,
        headers: makeAuthHeader(),
        payload: {
          title: "Updated",
          startsAt: "2026-07-01T18:00:00.000Z",
          description: "d",
          location: "l",
        },
      });

      assert.equal(res.statusCode, 403);
    });

    it("returns 401 without auth", async () => {
      const { app } = await createTestApp();
      const res = await app.inject({
        method: "PATCH",
        url: `/events/${fakeEventDetails.id}`,
        payload: {
          title: "Updated",
          startsAt: "2026-07-01T18:00:00.000Z",
        },
      });

      assert.equal(res.statusCode, 401);
    });
  });

  describe("GET /events/:id", () => {
    it("returns event details", async () => {
      const { app } = await createTestApp();
      const res = await app.inject({
        method: "GET",
        url: `/events/${fakeEventDetails.id}`,
      });

      assert.equal(res.statusCode, 200);
      assert.equal(res.json().id, fakeEventDetails.id);
    });

    it("returns 404 when not found", async () => {
      const { app } = await createTestApp({
        eventsRepo: { getEventDetails: () => Promise.resolve(null) },
      });
      const res = await app.inject({
        method: "GET",
        url: "/events/nonexistent",
      });

      assert.equal(res.statusCode, 404);
    });
  });

  describe("DELETE /events/:id", () => {
    it("deletes event", async () => {
      const { app, makeAuthHeader } = await createTestApp();
      const res = await app.inject({
        method: "DELETE",
        url: `/events/${fakeEventDetails.id}`,
        headers: makeAuthHeader(),
      });

      assert.equal(res.statusCode, 204);
    });

    it("returns 404 when event not found", async () => {
      const { app, makeAuthHeader } = await createTestApp({
        eventsRepo: { deleteEvent: () => Promise.resolve("not_found" as const) },
      });
      const res = await app.inject({
        method: "DELETE",
        url: `/events/${fakeEventDetails.id}`,
        headers: makeAuthHeader(),
      });

      assert.equal(res.statusCode, 404);
    });

    it("returns 403 when not owner", async () => {
      const { app, makeAuthHeader } = await createTestApp({
        eventsRepo: { deleteEvent: () => Promise.resolve("forbidden" as const) },
      });
      const res = await app.inject({
        method: "DELETE",
        url: `/events/${fakeEventDetails.id}`,
        headers: makeAuthHeader(),
      });

      assert.equal(res.statusCode, 403);
    });

    it("returns 401 without auth", async () => {
      const { app } = await createTestApp();
      const res = await app.inject({
        method: "DELETE",
        url: `/events/${fakeEventDetails.id}`,
      });

      assert.equal(res.statusCode, 401);
    });
  });

  describe("GET /events with filters", () => {
    it("passes search filter to repository", async () => {
      const listEvents = mock.fn((_filters?: { search?: string }) => Promise.resolve([]));
      const { app } = await createTestApp({ eventsRepo: { listEvents } });
      await app.inject({ method: "GET", url: "/events?search=hiking" });

      const calls = listEvents.mock.calls as Array<{ arguments: unknown[] }>;
      const filters = calls[0].arguments[0] as { search?: string };
      assert.equal(filters?.search, "hiking");
    });

    it("passes date filters to repository", async () => {
      const listEvents = mock.fn(() => Promise.resolve([]));
      const { app } = await createTestApp({ eventsRepo: { listEvents } });
      await app.inject({
        method: "GET",
        url: "/events?dateFrom=2026-01-01&dateTo=2026-12-31",
      });

      const calls = listEvents.mock.calls as Array<{ arguments: unknown[] }>;
      const filters = calls[0].arguments[0] as { dateFrom?: string; dateTo?: string };
      assert.equal(filters?.dateFrom, "2026-01-01");
      assert.equal(filters?.dateTo, "2026-12-31");
    });
  });
});
