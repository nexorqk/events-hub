# Events Hub

Full-stack MVP for creating events and joining or leaving them with password-based user accounts.

## Stack

- Web: React, TypeScript, Vite, Tailwind CSS, Zustand, React Router
- API: Fastify, TypeScript, TypeORM
- Database: PostgreSQL through Docker Compose

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

Reset local runtime state, including the PostgreSQL Docker volume:

```bash
./scripts/reset.sh
```

Use `./scripts/reset.sh --yes` for non-interactive reset, or `./scripts/reset.sh --deps` to also remove `api/node_modules` and `web/node_modules`. `./scripts/stop.sh` only stops processes tracked by `.runtime` PID files unless `--force-ports` is passed.

Manual setup:

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

Manual flow:

1. Register a user with a name and password.
2. List events (the events list page loads after sign-in).
3. Create an event.
4. Open the event details page.
5. Join the event.
6. Leave the event.
