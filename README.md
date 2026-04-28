# Events Hub

Full-stack MVP for creating events and joining or leaving them as demo users.

## Stack

- Web: React, TypeScript, Vite, Tailwind CSS, Zustand, React Router
- API: Fastify, TypeScript, TypeORM
- Database: PostgreSQL through Docker Compose

## Local Development

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

1. Enter a demo-user name.
2. Create an event.
3. List events (should show your created event).
4. Open the event details page.
5. Join the event.
6. Leave the event.
