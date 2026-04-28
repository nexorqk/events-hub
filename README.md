# Events Hub

Full-stack MVP for creating events and joining or leaving them as demo users.

## Stack

- Web: React, TypeScript, Vite, Tailwind CSS, Zustand
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
pnpm install
pnpm db:migrate
pnpm dev
```

Install and run the web app:

```bash
cd web
pnpm install
pnpm dev
```

Open `http://localhost:5173`.

## Manual Verification

1. Enter a demo-user name.
2. Create an event.
3. Open the event details page.
4. Join the event.
5. Leave the event.
