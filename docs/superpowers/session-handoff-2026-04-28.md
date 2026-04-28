# Session Handoff: Events Hub

Date: 2026-04-28

## Purpose

This document preserves the useful project context from the local OpenCode session so development can continue on a remote server through SSH / VS Code Remote SSH / OpenCode.

This is not a raw transcript. It intentionally contains only project decisions, user preferences, and continuation instructions.

## User Preferences

- User-facing answers and questions should be in Russian.
- Internal reasoning may be in English.
- Technical names can stay in English: React, TypeScript, Tailwind, Zustand, Fastify, TypeORM, PostgreSQL, pnpm.
- Development should follow spec-driven development.
- The server dependencies requested by the user must be installed at `latest` versions, ignoring versions shown in the screenshot.

## Current Repository State

- The folder started empty.
- No application code has been scaffolded yet.
- The agreed product and architecture spec is saved at `docs/superpowers/specs/2026-04-28-events-hub-design.md`.
- The implementation plan is saved at `docs/superpowers/plans/2026-04-28-events-hub-implementation.md`.
- The next step is to execute the implementation plan task by task.

## Agreed Product Scope

Build a full-stack MVP for events:

- Demo-user entry by name, without passwords.
- Event list.
- Event creation.
- Event details.
- Join/leave participation.
- Participant display.
- Basic loading and error states.

Out of scope for the MVP:

- Full registration and authentication.
- JWT sessions, password login, OAuth, password reset.
- Comments, chat, direct messages, notifications.
- RSVP statuses beyond join/leave.
- Real-time updates.
- Search, filtering, recommendations, moderation.

## Agreed Architecture

Use two independent application folders, not a pnpm workspace:

```text
events-hub/
  web/
  api/
  docker-compose.yml
  docs/
```

Frontend:

- React
- TypeScript
- Vite
- Tailwind CSS
- Zustand
- React Router

Backend:

- Fastify
- TypeScript
- TypeORM
- PostgreSQL through Docker Compose

API user context:

- The MVP sends the current demo user id in the `X-User-Id` request header.
- Full sessions/JWT auth are intentionally deferred.

## Required Server Dependencies

Install runtime dependencies at latest versions:

```bash
pnpm add @fastify/jwt@latest argon2@latest dotenv@latest fastify@latest pg@latest reflect-metadata@latest typeorm@latest
```

Install dev dependencies at latest versions:

```bash
pnpm add -D @types/node@latest ts-node@latest tsx@latest typeorm-ts-node-commonjs@latest typescript@latest
```

`@fastify/jwt` and `argon2` are included because the user requested them as server dependencies, but the first MVP should not implement password auth or JWT sessions.

## Important API Design

- `POST /users/demo`: create or find a demo user by name.
- `GET /events`: list events with participant counts.
- `POST /events`: create an event for the current demo user.
- `GET /events/:id`: get event details and participants.
- `POST /events/:id/join`: join an event.
- `DELETE /events/:id/join`: leave an event.

## Data Model

- `users`: `id`, `name`, `created_at`.
- `events`: `id`, `title`, `description`, `starts_at`, `location`, `created_by_user_id`, `created_at`, `updated_at`.
- `event_participants`: `event_id`, `user_id`, `created_at`.
- Duplicate joins should be prevented with a composite primary key on `event_id` and `user_id`.

## Continuation Instructions

Recommended next step in OpenCode:

1. Open `docs/superpowers/plans/2026-04-28-events-hub-implementation.md`.
2. Use the required execution skill from the plan header: `subagent-driven-development` or `executing-plans`.
3. Execute tasks in order.
4. Keep changes small and verify after each task.

The plan currently expects these broad phases:

- Root infrastructure and Docker Compose.
- API package, TypeORM entities, and migration.
- API routes and endpoint tests.
- TypeORM repository and API server entrypoint.
- Web package, API client, and Zustand stores.
- Web pages and user flow.
- End-to-end verification and README update.

## Verification Targets

Before calling the implementation complete, verify:

```bash
cd api
pnpm typecheck
pnpm test
```

```bash
cd web
pnpm typecheck
pnpm build
```

Manual flow:

1. Enter a demo-user name.
2. Create an event.
3. Open event details.
4. Join the event.
5. Leave the event.
6. Return to event list and confirm data loads.

## Notes For Remote Setup

- Clone the private GitHub repository on the server.
- Use SSH credentials / GitHub access appropriate for the server user.
- Start from the saved spec and plan before writing application code.
- Do not add full auth, social features, real-time behavior, or search unless the user explicitly expands the MVP scope.
