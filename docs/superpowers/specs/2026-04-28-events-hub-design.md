# Events Hub MVP Design

Date: 2026-04-28

## Goal

Create a new full-stack MVP for an events application. Users can enter as demo users, create events, browse events, view event details, and join or leave events.

The project starts in an empty folder and should be easy to run locally with PostgreSQL in Docker.

## Scope

Included in the first MVP:

- Demo-user sign-in by name, without password or email verification.
- Event list.
- Event creation.
- Event details.
- Join and leave event participation.
- Display event participants.
- Basic loading and error states.

Out of scope for the first MVP:

- Full registration and authentication.
- JWT, sessions, OAuth, or password reset.
- Comments, chat, direct messages, or notifications.
- RSVP statuses beyond simple join/leave.
- Real-time updates.
- Search, filtering, recommendations, or moderation.

## Project Structure

Use two independent application folders without a pnpm workspace:

```text
events-hub/
  web/
  api/
  docker-compose.yml
  docs/
```

`web` and `api` each have their own `package.json`, dependencies, scripts, and TypeScript configuration. Shared TypeScript packages are not introduced in the first MVP to keep the project simple. If strict shared API typing becomes important later, add generated types or a shared package as a follow-up.

## Frontend Design

The frontend is a Vite React application using TypeScript, Tailwind CSS, and Zustand.

Main routes:

- `/`: demo-user entry screen.
- `/events`: event list.
- `/events/new`: create event form.
- `/events/:id`: event details with participants and join/leave action.

Frontend state managed by Zustand:

- Current demo user.
- Event list.
- Selected event details.
- Loading and error states.

The UI should prioritize the core workflow: enter a name, browse events, create an event, open details, join, and leave.

## Backend Design

The backend is a Fastify application using TypeScript.

PostgreSQL is provided through `docker-compose.yml`. Database access uses TypeORM with `pg` and `reflect-metadata`. TypeORM entities, data-source configuration, and migrations live under `api`.

Required server runtime dependencies use `latest` versions:

- `@fastify/jwt`
- `argon2`
- `dotenv`
- `fastify`
- `pg`
- `reflect-metadata`
- `typeorm`

Required server development dependencies use `latest` versions:

- `@types/node`
- `ts-node`
- `tsx`
- `typeorm-ts-node-commonjs`
- `typescript`

`@fastify/jwt` and `argon2` are installed as the authentication foundation, but JWT sessions, passwords, and full registration remain out of scope for the first MVP.

API endpoints:

- `POST /users/demo`: create or find a demo user by name.
- `GET /events`: list events with participant counts.
- `POST /events`: create an event for the current demo user.
- `GET /events/:id`: get event details and participants.
- `POST /events/:id/join`: join an event.
- `DELETE /events/:id/join`: leave an event.

For the MVP, the frontend sends the current user id in an `X-User-Id` request header for endpoints that require a user. Full session management is intentionally deferred.

## Data Model

Tables:

- `users`: demo users.
- `events`: event records.
- `event_participants`: many-to-many relation between users and events.

`users` fields:

- `id`
- `name`
- `created_at`

`events` fields:

- `id`
- `title`
- `description`
- `starts_at`
- `location`
- `created_by_user_id`
- `created_at`
- `updated_at`

`event_participants` fields:

- `event_id`
- `user_id`
- `created_at`

The participant relation should prevent duplicate joins for the same user and event.

## Error Handling

Backend validation should reject missing or invalid required fields with clear `400` responses. Missing resources should return `404`. Unexpected errors should return `500` without leaking internals.

Frontend screens should show simple user-facing errors and keep failed actions recoverable. Join/leave failures should not silently change local state.

## Local Development

Expected local workflow:

```bash
docker compose up -d
cd api && pnpm install && pnpm db:migrate && pnpm dev
cd web && pnpm install && pnpm dev
```

The exact script names can be adjusted during implementation, but the project should provide clear scripts for development, database migrations, type checking, and production build.

## Testing And Verification

Minimum verification before calling the MVP complete:

- PostgreSQL starts through Docker Compose.
- API dependencies install successfully.
- Web dependencies install successfully.
- API type check passes.
- Web type check and build pass.
- Manual user flow works: enter demo user, create event, open event details, join event, leave event.

Add lightweight automated tests for API endpoints if they fit without delaying the initial scaffold. If not, keep automated tests as the first follow-up after the scaffold is running.

## Acceptance Criteria

- The project folder contains `web`, `api`, `docker-compose.yml`, and this specification.
- The app can be run locally with pnpm and Docker Compose.
- A demo user can be created or reused by name.
- A demo user can create an event.
- Events can be listed and opened.
- Event details show participants.
- A demo user can join and leave an event.
- The implementation stays focused on the MVP and does not add out-of-scope social features.
