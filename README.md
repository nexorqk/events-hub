# Events Hub

Full-stack web application for creating, discovering, and participating in local community events.

## Features

- **Authentication** — Google OAuth or quick demo (name-only) login
- **Events** — Create, edit, delete, and browse upcoming events
- **RSVP** — Three statuses: going, maybe, not going
- **Comments** — Post and delete comments on events (author or host)
- **Search & Filter** — Find events by title/location or date range
- **Real-time Updates** — SSE-powered live updates across browser tabs

## Stack

- **Web:** React 19, TypeScript, Vite, Mantine UI, Zustand, React Router, Framer Motion
- **API:** Fastify, TypeScript, TypeORM
- **Database:** PostgreSQL (via Docker Compose)
- **Testing:** Node.js built-in test runner, Fastify inject

## Local Development

Quick start:

```bash
./scripts/start.sh
```

Stop services:

```bash
./scripts/stop.sh
```

Check service status and inspect logs:

```bash
./scripts/status.sh
./scripts/logs.sh all
```

Run verification:

```bash
./scripts/check.sh
```

Run database helpers:

```bash
./scripts/db.sh migrate
./scripts/db.sh shell
```

Seed demo data (after migrations):

```bash
cd api
pnpm db:seed
```

Reset local runtime state, including the PostgreSQL Docker volume:

```bash
./scripts/reset.sh
```

Use `./scripts/reset.sh --yes` for non-interactive reset, or `./scripts/reset.sh --deps` to also remove `api/node_modules` and `web/node_modules`. `./scripts/stop.sh` only stops processes tracked by `.runtime` PID files unless `--force-ports` is passed.

### Manual setup

Start PostgreSQL:

```bash
docker compose up -d
```

Install and run the API:

```bash
cd api
cp .env.example .env
corepack pnpm install
corepack pnpm db:migrate
corepack pnpm dev
```

Install and run the web app:

```bash
cd web
corepack pnpm install
corepack pnpm dev
```

The API runs on `http://localhost:3000` and the web app runs on `http://localhost:5173`.

## Verification

API:

```bash
cd api
corepack pnpm typecheck
corepack pnpm test
```

Web:

```bash
cd web
corepack pnpm typecheck
corepack pnpm build
```

## Manual Test Flow

1. Sign in with Google OAuth or enter a demo name.
2. Browse the events list with optional search/filter.
3. Create an event.
4. Open the event details page.
5. RSVP (going/maybe/not going).
6. Post a comment.
7. Open a second browser tab to verify real-time updates.
8. Delete a comment or the event (as host).
