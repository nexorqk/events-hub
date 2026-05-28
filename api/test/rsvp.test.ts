import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createTestApp } from "./helpers/create-test-app";
import { fakeEventDetails, fakeEventSummary } from "./helpers/mock-events-repository";

describe("RSVP routes", () => {
  describe("POST /events/:id/rsvp", () => {
    it("sets RSVP with valid status", async () => {
      const { app, makeAuthHeader } = await createTestApp();
      for (const status of ["going", "maybe", "not_going"]) {
        const res = await app.inject({
          method: "POST",
          url: `/events/${fakeEventSummary.id}/rsvp`,
          headers: makeAuthHeader(),
          payload: { status },
        });
        assert.equal(res.statusCode, 200, `status=${status} should return 200`);
      }
    });

    it("returns 400 with invalid status", async () => {
      const { app, makeAuthHeader } = await createTestApp();
      const res = await app.inject({
        method: "POST",
        url: `/events/${fakeEventSummary.id}/rsvp`,
        headers: makeAuthHeader(),
        payload: { status: "invalid" },
      });

      assert.equal(res.statusCode, 400);
      assert.match(res.json().message, /status/i);
    });

    it("returns 400 with missing status", async () => {
      const { app, makeAuthHeader } = await createTestApp();
      const res = await app.inject({
        method: "POST",
        url: `/events/${fakeEventSummary.id}/rsvp`,
        headers: makeAuthHeader(),
        payload: {},
      });

      assert.equal(res.statusCode, 400);
    });

    it("returns 401 without auth", async () => {
      const { app } = await createTestApp();
      const res = await app.inject({
        method: "POST",
        url: `/events/${fakeEventSummary.id}/rsvp`,
        payload: { status: "going" },
      });

      assert.equal(res.statusCode, 401);
    });

    it("returns 404 when event not found", async () => {
      const { app, makeAuthHeader } = await createTestApp({
        eventsRepo: { setRsvp: () => Promise.resolve(null) },
      });
      const res = await app.inject({
        method: "POST",
        url: `/events/${fakeEventSummary.id}/rsvp`,
        headers: makeAuthHeader(),
        payload: { status: "going" },
      });

      assert.equal(res.statusCode, 404);
    });
  });

  describe("DELETE /events/:id/rsvp", () => {
    it("removes RSVP", async () => {
      const { app, makeAuthHeader } = await createTestApp();
      const res = await app.inject({
        method: "DELETE",
        url: `/events/${fakeEventSummary.id}/rsvp`,
        headers: makeAuthHeader(),
      });

      assert.equal(res.statusCode, 200);
    });

    it("returns 401 without auth", async () => {
      const { app } = await createTestApp();
      const res = await app.inject({
        method: "DELETE",
        url: `/events/${fakeEventSummary.id}/rsvp`,
      });

      assert.equal(res.statusCode, 401);
    });

    it("returns 404 when event not found", async () => {
      const { app, makeAuthHeader } = await createTestApp({
        eventsRepo: { removeRsvp: () => Promise.resolve(null) },
      });
      const res = await app.inject({
        method: "DELETE",
        url: `/events/${fakeEventSummary.id}/rsvp`,
        headers: makeAuthHeader(),
      });

      assert.equal(res.statusCode, 404);
    });
  });
});
