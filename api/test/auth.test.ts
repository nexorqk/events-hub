import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { createTestApp } from "./helpers/create-test-app";
import { fakeUser } from "./helpers/mock-events-repository";

describe("Auth routes", () => {
  describe("POST /auth/demo", () => {
    it("returns session with valid name", async () => {
      const { app } = await createTestApp();
      const res = await app.inject({
        method: "POST",
        url: "/auth/demo",
        payload: { name: "Alice" },
      });

      assert.equal(res.statusCode, 200);
      const body = res.json();
      assert.ok(body.token);
      assert.equal(body.user.name, fakeUser.name);
    });

    it("returns 400 with empty name", async () => {
      const { app } = await createTestApp();
      const res = await app.inject({
        method: "POST",
        url: "/auth/demo",
        payload: { name: "" },
      });

      assert.equal(res.statusCode, 400);
      assert.match(res.json().message, /name/i);
    });

    it("returns 400 with missing name", async () => {
      const { app } = await createTestApp();
      const res = await app.inject({
        method: "POST",
        url: "/auth/demo",
        payload: {},
      });

      assert.equal(res.statusCode, 400);
    });

    it("calls findOrCreateDemoUser with trimmed name", async () => {
      const userRepo = {
        findOrCreateDemoUser: mock.fn(() => Promise.resolve(fakeUser)),
      };
      const { app } = await createTestApp({ userRepo: userRepo as never });
      await app.inject({
        method: "POST",
        url: "/auth/demo",
        payload: { name: "  Alice  " },
      });

      assert.equal(userRepo.findOrCreateDemoUser.mock.callCount(), 1);
      const calls = userRepo.findOrCreateDemoUser.mock.calls as Array<{ arguments: unknown[] }>;
      assert.deepEqual(calls[0].arguments[0], { name: "Alice" });
    });
  });

  describe("GET /auth/me", () => {
    it("returns user with valid JWT", async () => {
      const { app, makeAuthHeader } = await createTestApp();
      const res = await app.inject({
        method: "GET",
        url: "/auth/me",
        headers: makeAuthHeader(),
      });

      assert.equal(res.statusCode, 200);
      assert.equal(res.json().id, fakeUser.id);
    });

    it("returns 401 without token", async () => {
      const { app } = await createTestApp();
      const res = await app.inject({ method: "GET", url: "/auth/me" });

      assert.equal(res.statusCode, 401);
    });

    it("returns 401 with invalid token", async () => {
      const { app } = await createTestApp();
      const res = await app.inject({
        method: "GET",
        url: "/auth/me",
        headers: { Authorization: "Bearer invalid.token.here" },
      });

      assert.equal(res.statusCode, 401);
    });

    it("returns 401 when user not found", async () => {
      const userRepo = {
        findById: mock.fn(() => Promise.resolve(null)),
      };
      const { app, makeAuthHeader } = await createTestApp({ userRepo: userRepo as never });
      const res = await app.inject({
        method: "GET",
        url: "/auth/me",
        headers: makeAuthHeader(),
      });

      assert.equal(res.statusCode, 401);
    });
  });
});
