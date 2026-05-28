# Plan: Automated Tests, Real-Time Updates, and web/dist Cleanup

## Objective

Add comprehensive API tests, implement real-time event updates via SSE, and verify that `web/dist` is properly gitignored (it already is — no work needed).

## Requirements Snapshot

- **R1:** Automated tests covering all API routes with mocked repositories
- **R2:** Real-time updates so connected clients see new events, RSVPs, and comments without refreshing
- **R3:** `web/dist` should not be tracked in git (already satisfied — gitignored and untracked)

## Scope

- API unit/integration tests using Node.js built-in test runner + Fastify `inject()`
- SSE (Server-Sent Events) endpoint for real-time updates
- Frontend SSE client integration with Zustand store updates
- Vite proxy update for SSE endpoint

## Assumptions and Constraints

- Test runner: Node.js built-in `node:test` via `tsx --test` (already in `api/package.json`)
- No additional test framework dependencies needed (use `node:test` built-in `mock`)
- Fastify's built-in `app.inject()` for HTTP testing (no `supertest` needed)
- SSE chosen over WebSocket: simpler, auto-reconnects, sufficient for one-way server→client push
- Repositories are injected via `createApp({ userRepository, eventsRepository })` — clean DI for mocking

## Risks and Areas Requiring Care

- `env` module executes `validateEnv(process.env)` at import time — tests must set env vars before importing or mock the module
- Google OAuth (`google-auth-library`) must be mocked in auth tests
- SSE connections are long-lived — need proper cleanup on client disconnect
- Vite proxy needs `ws: false` and proper SSE headers (`text/event-stream`)

## Core Concepts

### Test Structure

Tests use `node:test` with `describe`/`it`. Each test file creates a Fastify app with mocked repositories and uses `app.inject()` to make HTTP requests without starting a real server.

```typescript
import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";

// Mock repository factory
function createMockEventsRepository(overrides: Partial<EventsRepository> = {}): EventsRepository {
  return {
    listEvents: mock.fn(() => Promise.resolve([])),
    createEvent: mock.fn(() => Promise.resolve(null)),
    // ...all methods with sensible defaults
    ...overrides,
  };
}
```

### SSE Architecture

```
Client → GET /events/stream → SSE connection held open
Server → emits events on mutations → broadcasts to all connected SSE clients per event ID
```

Event types: `event:created`, `event:updated`, `rsvp:changed`, `comment:added`, `comment:deleted`

## Sub-Tasks

### Sub-Task 1: API Test Infrastructure

- **Status:** Pending
- **Objective:** Set up test helpers, mock factories, and a test app builder
- **Related Requirements:** R1
- **Dependencies and Preconditions:** None
- **In Scope for This Sub-Task:**
  - Create `api/test/helpers/mock-events-repository.ts` with all `EventsRepository` methods mocked
  - Create `api/test/helpers/mock-user-repository.ts` with `TypeOrmUserRepository` methods mocked
  - Create `api/test/helpers/create-test-app.ts` that builds a Fastify app with injected mocks and JWT configured with a test secret
  - Handle `env` module import issue by setting `process.env` before import or using a test-specific env
- **Out of Scope:** Actual test cases (covered in sub-tasks 2-6)
- **Instructions:**
  - Use `mock.fn()` from `node:test` for all mock methods
  - Return sensible defaults (empty arrays, null, etc.)
  - `createTestApp` should return `{ app, repos, userRepo }` so tests can assert on mock calls
  - Generate a valid JWT token helper for authenticated route tests
- **Acceptance Criteria:** Test helpers compile and can be imported by test files
- **Cautionary Points:** The `env` module runs `validateEnv(process.env)` on import — set defaults in test setup or the import will throw
- **Testing Suggestions:** Write a smoke test that imports the helpers and creates an app instance
- **Done When:** `api/test/helpers/` exists with reusable mock factories and app builder

### Sub-Task 2: Auth Route Tests

- **Status:** Pending
- **Objective:** Test `/auth/demo`, `/auth/google`, `/auth/me` endpoints
- **Related Requirements:** R1
- **Dependencies and Preconditions:** Sub-Task 1 (test helpers)
- **In Scope for This Sub-Task:**
  - `POST /auth/demo` — success with valid name, 400 with empty/missing name
  - `POST /auth/google` — success with valid credential (mock OAuth2Client), 400 with empty credential, 401 with invalid credential, 500 when GOOGLE_CLIENT_ID not configured
  - `GET /auth/me` — success with valid JWT, 401 without token, 401 with expired/invalid token
  - Verify JWT token is returned and contains correct `sub` claim
- **Out of Scope:** Testing actual Google OAuth flow (mock the library)
- **Instructions:**
  - Mock `google-auth-library`'s `OAuth2Client.verifyIdToken` to return a fake ticket
  - For `/auth/me`, generate a real JWT using the test app's `jwt.sign()`
- **Acceptance Criteria:** All auth routes covered with happy and error paths
- **Cautionary Points:** The Google OAuth test needs to mock the `OAuth2Client` class — use `mock.module()` or inject a mock at the test level
- **Testing Suggestions:** `pnpm test test/auth.test.ts`
- **Done When:** Auth tests pass with full coverage of validation and error cases

### Sub-Task 3: Event CRUD Route Tests

- **Status:** Pending
- **Objective:** Test `GET /events`, `POST /events`, `PATCH /events/:id`, `GET /events/:id`
- **Related Requirements:** R1
- **Dependencies and Preconditions:** Sub-Task 1
- **In Scope for This Sub-Task:**
  - `GET /events` — returns event list, empty array when no events
  - `POST /events` — creates event with valid input, 400 without title, 400 without startsAt, 401 without auth, returns 201 with full event details
  - `PATCH /events/:id` — updates event, 404 for missing event, 403 for non-owner, 401 without auth
  - `GET /events/:id` — returns event details, 404 for missing event
- **Out of Scope:** Database-level tests (mocked repositories)
- **Instructions:**
  - Mock repository methods to return appropriate data
  - Verify request body validation (missing fields, wrong types)
  - Verify the correct repository method is called with correct arguments
- **Acceptance Criteria:** All CRUD routes covered with happy and error paths
- **Cautionary Points:** `PATCH /events/:id` has three outcomes: updated, not_found, forbidden — test all three
- **Testing Suggestions:** `pnpm test test/events.test.ts`
- **Done When:** Event CRUD tests pass

### Sub-Task 4: RSVP Route Tests

- **Status:** Pending
- **Objective:** Test `POST /events/:id/rsvp`, `DELETE /events/:id/rsvp`
- **Related Requirements:** R1
- **Dependencies and Preconditions:** Sub-Task 1
- **In Scope for This Sub-Task:**
  - `POST /events/:id/rsvp` — sets going/maybe/not_going, 400 for invalid status, 401 without auth, 404 for missing event
  - `DELETE /events/:id/rsvp` — removes RSVP, 401 without auth, 404 for missing event
  - Verify all three valid statuses work
- **Out of Scope:** Testing RSVP upsert logic (that's repository-level)
- **Instructions:** Mock `setRsvp` and `removeRsvp` to return event details or null
- **Acceptance Criteria:** All RSVP routes and status validation covered
- **Testing Suggestions:** `pnpm test test/rsvp.test.ts`
- **Done When:** RSVP tests pass

### Sub-Task 5: Comment Route Tests

- **Status:** Pending
- **Objective:** Test `GET /events/:id/comments`, `POST /events/:id/comments`, `DELETE /events/:id/comments/:commentId`
- **Related Requirements:** R1
- **Dependencies and Preconditions:** Sub-Task 1
- **In Scope for This Sub-Task:**
  - `GET /events/:id/comments` — returns comments list, 404 for missing event
  - `POST /events/:id/comments` — creates comment, 400 with empty content, 401 without auth, 404 for missing event
  - `DELETE /events/:id/comments/:commentId` — deletes comment, 403 when not author/host, 401 without auth, 204 on success
- **Out of Scope:** Comment permission logic testing (that's repository-level)
- **Instructions:** Mock `createComment`, `deleteComment`, `listComments`
- **Acceptance Criteria:** All comment routes covered
- **Testing Suggestions:** `pnpm test test/comments.test.ts`
- **Done When:** Comment tests pass

### Sub-Task 6: SSE Backend Implementation

- **Status:** Pending
- **Objective:** Add SSE endpoint and event broadcasting to the API
- **Related Requirements:** R2
- **Dependencies and Preconditions:** None (independent of test sub-tasks)
- **In Scope for This Sub-Task:**
  - Create `api/src/http/event-bus.ts` — a simple typed event emitter (EventEmitter or custom) that fires on: `event:created`, `event:updated`, `rsvp:changed`, `comment:added`, `comment:deleted`
  - Create `api/src/http/sse.ts` — SSE route handler that subscribes to the event bus for a specific event ID (or all events for the list page)
  - Modify `api/src/http/app.ts`:
    - Accept `eventBus` in `AppDependencies`
    - After each successful mutation (create/update event, set/remove RSVP, create/delete comment), emit the appropriate event on the bus
    - Register SSE route: `GET /events/stream` (all events) and `GET /events/:id/stream` (specific event)
  - Modify `api/src/server.ts` to create and pass the event bus
  - Add `@fastify/sse` or implement SSE manually (it's just `text/event-stream` headers + `data:` lines)
- **Out of Scope:** Authentication on SSE endpoint (optional — events are public data)
- **Instructions:**
  - Use Node.js `EventEmitter` with typed events
  - SSE response format: `event: <type>\ndata: <json>\n\n`
  - Clean up listeners on client disconnect (`request.raw.on('close', ...)`)
  - Broadcast to all connected clients — no per-user filtering needed
  - For the list page stream: emit `event:created` and `event:updated` with `EventSummary` data
  - For detail page stream: emit all event types with full `EventDetails` data
- **Acceptance Criteria:** SSE endpoint sends events when mutations occur; connections are cleaned up on disconnect
- **Cautionary Points:**
  - Must set `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`
  - Fastify may buffer responses — need `reply.raw.write()` for SSE or use `@fastify/sse`
  - Don't block mutation responses on broadcast — fire and forget
- **Testing Suggestions:** Write a test that creates an app, opens an SSE connection via `inject()`, performs a mutation, and verifies the SSE event is received
- **Done When:** SSE endpoint streams real-time updates

### Sub-Task 7: SSE Frontend Integration

- **Status:** Pending
- **Objective:** Connect the frontend to the SSE stream and update stores in real-time
- **Related Requirements:** R2
- **Dependencies and Preconditions:** Sub-Task 6 (SSE backend)
- **In Scope for This Sub-Task:**
  - Create `web/src/api/sse.ts` — EventSource wrapper with auto-reconnect and event parsing
  - Modify `web/src/stores/eventsStore.ts`:
    - Add `subscribeToEvents()` action that opens SSE to `/api/events/stream`
    - On `event:created`: add to `events` array
    - On `event:updated`: update in `events` array and `selectedEvent` if matching
    - On `rsvp:changed`: update `selectedEvent` if matching, update `participantCount` in list
    - On `comment:added`: append to `selectedEvent.comments` if matching
    - On `comment:deleted`: remove from `selectedEvent.comments` if matching
    - Add `unsubscribeFromEvents()` action to close the connection
  - Modify `web/src/stores/eventsStore.ts` `loadEvent()`:
    - Also subscribe to `/api/events/:id/stream` for detail-specific events
  - Modify `web/src/pages/EventsListPage.tsx`:
    - Call `subscribeToEvents()` on mount, `unsubscribeFromEvents()` on unmount
  - Modify `web/src/pages/EventDetailsPage.tsx`:
    - Subscribe to event-specific stream on mount
  - Update `web/vite.config.ts` proxy to handle SSE (may need special headers)
- **Out of Scope:** Optimistic updates (already handled by existing code); offline support
- **Instructions:**
  - Use native `EventSource` API (no library needed)
  - Auto-reconnect with exponential backoff on connection error
  - Parse SSE `data` field as JSON
  - Use `event` field to determine event type
  - Debounce rapid updates if needed (e.g., multiple RSVPs in quick succession)
- **Acceptance Criteria:** When one client makes a change, another open client sees it without refreshing
- **Cautionary Points:**
  - `EventSource` doesn't support custom headers — auth token would need to be a query param if we add auth to SSE later
  - Vite proxy may need `configure` function to handle SSE properly (disable buffering)
  - React StrictMode runs effects twice in dev — ensure only one SSE connection per component
- **Testing Suggestions:** Manual test: open two browser tabs, create an event in one, verify it appears in the other
- **Done When:** Real-time updates work across browser tabs

### Sub-Task 8: SSE Tests

- **Status:** Pending
- **Objective:** Test SSE endpoint and event broadcasting
- **Related Requirements:** R1, R2
- **Dependencies and Preconditions:** Sub-Task 6
- **In Scope for This Sub-Task:**
  - Test that SSE connection is established and returns proper headers
  - Test that `event:created` is broadcast when an event is created
  - Test that `rsvp:changed` is broadcast when an RSVP is set
  - Test that `comment:added` is broadcast when a comment is posted
  - Test that client disconnect cleans up listeners
- **Out of Scope:** Frontend SSE client tests (would need a browser environment)
- **Instructions:**
  - Use `app.inject()` to open an SSE connection (return a raw response stream)
  - Perform mutations via separate `inject()` calls
  - Read from the SSE stream and assert on received events
- **Acceptance Criteria:** SSE broadcasting is verified by automated tests
- **Cautionary Points:** `inject()` returns a response object — need to read from the raw stream for SSE
- **Testing Suggestions:** `pnpm test test/sse.test.ts`
- **Done When:** SSE tests pass

### Sub-Task 9: Update package.json Scripts and Run All Tests

- **Status:** Pending
- **Objective:** Ensure `pnpm test` runs all tests and passes
- **Related Requirements:** R1
- **Dependencies and Preconditions:** All test sub-tasks (2-5, 8)
- **In Scope for This Sub-Task:**
  - Verify `api/package.json` test script matches test file locations
  - Run `pnpm test` in `api/` and verify all tests pass
  - Run `pnpm typecheck` to verify no type errors
  - Fix any issues found
- **Out of Scope:** CI/CD setup, coverage reporting
- **Instructions:** Run tests, fix failures, ensure clean typecheck
- **Acceptance Criteria:** `pnpm test` passes with 0 failures; `pnpm typecheck` passes
- **Testing Suggestions:** `pnpm test && pnpm typecheck`
- **Done When:** All tests green, typecheck clean

## Final Integration & Verification

- **System-Wide Test:**
  1. `cd api && pnpm test` — all tests pass
  2. `cd api && pnpm typecheck` — no type errors
  3. `cd web && pnpm typecheck` — no type errors
  4. Manual SSE verification: start dev server, open two tabs, verify real-time sync
- **Completion Checklist:**
  - [ ] All API routes have test coverage (auth, events, RSVP, comments)
  - [ ] SSE endpoint broadcasts mutations in real-time
  - [ ] Frontend subscribes to SSE and updates stores
  - [ ] All tests pass
  - [ ] Typecheck clean on both api and web
  - [ ] `web/dist` confirmed untracked (already done)

## Open Questions

- Should the SSE endpoint require authentication? (Current plan: no, since event data is public)
- Should we add `@fastify/sse` as a dependency or implement SSE manually? (Leaning manual — it's ~20 lines)
