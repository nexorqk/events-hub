import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createTestApp } from "./helpers/create-test-app";
import { fakeComment, fakeEventDetails, fakeEventSummary } from "./helpers/mock-events-repository";

describe("Comment routes", () => {
  describe("GET /events/:id/comments", () => {
    it("returns comments list", async () => {
      const { app } = await createTestApp();
      const res = await app.inject({
        method: "GET",
        url: `/events/${fakeEventSummary.id}/comments`,
      });

      assert.equal(res.statusCode, 200);
      const body = res.json();
      assert.ok(Array.isArray(body));
      assert.equal(body.length, 1);
      assert.equal(body[0].id, fakeComment.id);
    });

    it("returns 404 when event not found", async () => {
      const { app } = await createTestApp({
        eventsRepo: { getEventDetails: () => Promise.resolve(null) },
      });
      const res = await app.inject({
        method: "GET",
        url: "/events/nonexistent/comments",
      });

      assert.equal(res.statusCode, 404);
    });
  });

  describe("POST /events/:id/comments", () => {
    it("creates comment", async () => {
      const { app, makeAuthHeader } = await createTestApp();
      const res = await app.inject({
        method: "POST",
        url: `/events/${fakeEventSummary.id}/comments`,
        headers: makeAuthHeader(),
        payload: { content: "Great event!" },
      });

      assert.equal(res.statusCode, 201);
      assert.equal(res.json().content, fakeComment.content);
    });

    it("returns 400 with empty content", async () => {
      const { app, makeAuthHeader } = await createTestApp();
      const res = await app.inject({
        method: "POST",
        url: `/events/${fakeEventSummary.id}/comments`,
        headers: makeAuthHeader(),
        payload: { content: "" },
      });

      assert.equal(res.statusCode, 400);
    });

    it("returns 400 with missing content", async () => {
      const { app, makeAuthHeader } = await createTestApp();
      const res = await app.inject({
        method: "POST",
        url: `/events/${fakeEventSummary.id}/comments`,
        headers: makeAuthHeader(),
        payload: {},
      });

      assert.equal(res.statusCode, 400);
    });

    it("returns 401 without auth", async () => {
      const { app } = await createTestApp();
      const res = await app.inject({
        method: "POST",
        url: `/events/${fakeEventSummary.id}/comments`,
        payload: { content: "test" },
      });

      assert.equal(res.statusCode, 401);
    });

    it("returns 404 when event not found", async () => {
      const { app, makeAuthHeader } = await createTestApp({
        eventsRepo: { createComment: () => Promise.resolve(null) },
      });
      const res = await app.inject({
        method: "POST",
        url: `/events/${fakeEventSummary.id}/comments`,
        headers: makeAuthHeader(),
        payload: { content: "test" },
      });

      assert.equal(res.statusCode, 404);
    });
  });

  describe("DELETE /events/:id/comments/:commentId", () => {
    it("deletes comment", async () => {
      const { app, makeAuthHeader } = await createTestApp();
      const res = await app.inject({
        method: "DELETE",
        url: `/events/${fakeEventSummary.id}/comments/${fakeComment.id}`,
        headers: makeAuthHeader(),
      });

      assert.equal(res.statusCode, 204);
    });

    it("returns 403 when not authorized", async () => {
      const { app, makeAuthHeader } = await createTestApp({
        eventsRepo: { deleteComment: () => Promise.resolve(false) },
      });
      const res = await app.inject({
        method: "DELETE",
        url: `/events/${fakeEventSummary.id}/comments/${fakeComment.id}`,
        headers: makeAuthHeader(),
      });

      assert.equal(res.statusCode, 403);
    });

    it("returns 401 without auth", async () => {
      const { app } = await createTestApp();
      const res = await app.inject({
        method: "DELETE",
        url: `/events/${fakeEventSummary.id}/comments/${fakeComment.id}`,
      });

      assert.equal(res.statusCode, 401);
    });
  });
});
