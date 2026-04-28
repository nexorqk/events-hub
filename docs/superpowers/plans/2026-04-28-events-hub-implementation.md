# Events Hub MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local full-stack Events Hub MVP where demo users can create events, view events, and join or leave them.

**Architecture:** The project uses two independent applications: `api` for Fastify and PostgreSQL, and `web` for Vite React. The API owns persistence and validation; the web app calls it through a Vite `/api` proxy and keeps UI state in Zustand.

**Tech Stack:** React, TypeScript, Vite, Tailwind CSS, Zustand, React Router, Fastify, TypeORM, PostgreSQL, pnpm, Docker Compose.

---

## Commit Policy

Commit steps below are checkpoints. Use them only when the folder is a git repository and the user has approved committing changes.

## File Structure

Root files:

- Create: `.gitignore` - ignore dependencies, build outputs, local env files, and database volumes.
- Create: `docker-compose.yml` - local PostgreSQL service.
- Create: `README.md` - development commands and manual verification flow.

API files:

- Create: `api/package.json` - scripts for dev, typecheck, tests, and TypeORM migrations.
- Create: `api/tsconfig.json` - CommonJS TypeScript config with decorator metadata for TypeORM.
- Create: `api/.env.example` - documented local API environment.
- Create: `api/src/config/env.ts` - reads API and database environment variables.
- Create: `api/src/db/data-source.ts` - TypeORM DataSource.
- Create: `api/src/db/entities/user.entity.ts` - demo user entity.
- Create: `api/src/db/entities/event.entity.ts` - event entity.
- Create: `api/src/db/entities/event-participant.entity.ts` - event participant join entity.
- Create: `api/src/db/migrations/2026042800000-InitEventsHub.ts` - database schema migration.
- Create: `api/src/db/typeormEventsRepository.ts` - TypeORM implementation of API persistence.
- Create: `api/src/domain/models.ts` - API domain DTOs.
- Create: `api/src/domain/eventsRepository.ts` - repository interface used by routes.
- Create: `api/src/http/app.ts` - Fastify app factory and routes.
- Create: `api/src/server.ts` - production API entrypoint.
- Create: `api/test/app.test.ts` - endpoint tests using an in-memory repository.

Web files:

- Create: `web/package.json` - scripts for dev, typecheck, and build.
- Create: `web/tsconfig.json` - React TypeScript config.
- Create: `web/index.html` - Vite HTML entry.
- Create: `web/vite.config.ts` - React, Tailwind, and `/api` proxy.
- Create: `web/src/main.tsx` - React entrypoint.
- Create: `web/src/App.tsx` - route definitions.
- Create: `web/src/index.css` - Tailwind import and base styling.
- Create: `web/src/types.ts` - frontend API types.
- Create: `web/src/api/client.ts` - typed fetch client.
- Create: `web/src/stores/sessionStore.ts` - current demo-user store.
- Create: `web/src/stores/eventsStore.ts` - event list/details store.
- Create: `web/src/components/Layout.tsx` - shared page chrome.
- Create: `web/src/pages/HomePage.tsx` - demo-user entry.
- Create: `web/src/pages/EventsListPage.tsx` - event list.
- Create: `web/src/pages/NewEventPage.tsx` - create event form.
- Create: `web/src/pages/EventDetailsPage.tsx` - event details and join/leave.

---

### Task 1: Root Infrastructure

**Files:**
- Create: `.gitignore`
- Create: `docker-compose.yml`
- Create: `api/.env.example`
- Create: `README.md`

- [ ] **Step 1: Create root ignore rules**

Create `.gitignore`:

```gitignore
node_modules/
dist/
coverage/
.env
.env.*
!.env.example
.DS_Store
*.log
```

- [ ] **Step 2: Create PostgreSQL Docker Compose service**

Create `docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: events_hub_postgres
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: events_hub
      POSTGRES_PASSWORD: events_hub_password
      POSTGRES_DB: events_hub
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U events_hub -d events_hub"]
      interval: 5s
      timeout: 5s
      retries: 10
    volumes:
      - events_hub_postgres_data:/var/lib/postgresql/data

volumes:
  events_hub_postgres_data:
```

- [ ] **Step 3: Create API environment example**

Create `api/.env.example`:

```dotenv
DATABASE_URL=postgres://events_hub:events_hub_password@localhost:5432/events_hub
API_HOST=0.0.0.0
API_PORT=3000
JWT_SECRET=dev-only-secret-change-me
```

- [ ] **Step 4: Create initial README**

Create `README.md`:

```markdown
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
```

- [ ] **Step 5: Verify PostgreSQL starts**

Run:

```bash
docker compose up -d
```

Expected: Docker starts `events_hub_postgres` and reports the service as running or healthy.

- [ ] **Step 6: Commit checkpoint if commits are approved**

Only if the user has explicitly approved commits and the folder is a git repository, run:

```bash
git add .gitignore docker-compose.yml README.md api/.env.example
git commit -m "chore: add local project infrastructure"
```

Expected: a commit is created. If commits are not approved, skip this step.

---

### Task 2: API Package, TypeORM Entities, And Migration

**Files:**
- Create: `api/package.json`
- Create: `api/tsconfig.json`
- Create: `api/src/config/env.ts`
- Create: `api/src/db/data-source.ts`
- Create: `api/src/db/entities/user.entity.ts`
- Create: `api/src/db/entities/event.entity.ts`
- Create: `api/src/db/entities/event-participant.entity.ts`
- Create: `api/src/db/migrations/2026042800000-InitEventsHub.ts`

- [ ] **Step 1: Create API package scripts**

Create `api/package.json`:

```json
{
  "name": "events-hub-api",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "start": "node dist/server.js",
    "typecheck": "tsc --noEmit",
    "test": "tsx --test test/**/*.test.ts",
    "db:migrate": "typeorm-ts-node-commonjs -d src/db/data-source.ts migration:run",
    "db:revert": "typeorm-ts-node-commonjs -d src/db/data-source.ts migration:revert"
  },
  "dependencies": {},
  "devDependencies": {}
}
```

- [ ] **Step 2: Install required API runtime dependencies at latest**

Run:

```bash
pnpm add @fastify/jwt@latest argon2@latest dotenv@latest fastify@latest pg@latest reflect-metadata@latest typeorm@latest
```

Expected: `api/package.json` contains these packages under `dependencies` with current latest versions.

- [ ] **Step 3: Install required API development dependencies at latest**

Run:

```bash
pnpm add -D @types/node@latest ts-node@latest tsx@latest typeorm-ts-node-commonjs@latest typescript@latest
```

Expected: `api/package.json` contains these packages under `devDependencies` with current latest versions.

- [ ] **Step 4: Create API TypeScript config**

Create `api/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "Node",
    "lib": ["ES2022"],
    "rootDir": ".",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*.ts", "test/**/*.ts"]
}
```

- [ ] **Step 5: Create environment reader**

Create `api/src/config/env.ts`:

```ts
import "dotenv/config";

export const env = {
  databaseUrl:
    process.env.DATABASE_URL ??
    "postgres://events_hub:events_hub_password@localhost:5432/events_hub",
  host: process.env.API_HOST ?? "0.0.0.0",
  port: Number(process.env.API_PORT ?? 3000),
  jwtSecret: process.env.JWT_SECRET ?? "dev-only-secret-change-me",
};
```

- [ ] **Step 6: Create TypeORM entities**

Create `api/src/db/entities/user.entity.ts`:

```ts
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { EventEntity } from "./event.entity";
import { EventParticipantEntity } from "./event-participant.entity";

@Entity({ name: "users" })
export class UserEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 120, unique: true })
  name!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @OneToMany(() => EventEntity, (event) => event.createdBy)
  events!: EventEntity[];

  @OneToMany(() => EventParticipantEntity, (participant) => participant.user)
  participations!: EventParticipantEntity[];
}
```

Create `api/src/db/entities/event.entity.ts`:

```ts
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { UserEntity } from "./user.entity";
import { EventParticipantEntity } from "./event-participant.entity";

@Entity({ name: "events" })
export class EventEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 160 })
  title!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({ name: "starts_at", type: "timestamptz" })
  startsAt!: Date;

  @Column({ type: "varchar", length: 200 })
  location!: string;

  @Column({ name: "created_by_user_id", type: "uuid" })
  createdByUserId!: string;

  @ManyToOne(() => UserEntity, (user) => user.events, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "created_by_user_id" })
  createdBy!: UserEntity;

  @OneToMany(() => EventParticipantEntity, (participant) => participant.event)
  participants!: EventParticipantEntity[];

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
```

Create `api/src/db/entities/event-participant.entity.ts`:

```ts
import { CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { EventEntity } from "./event.entity";
import { UserEntity } from "./user.entity";

@Entity({ name: "event_participants" })
export class EventParticipantEntity {
  @PrimaryColumn({ name: "event_id", type: "uuid" })
  eventId!: string;

  @PrimaryColumn({ name: "user_id", type: "uuid" })
  userId!: string;

  @ManyToOne(() => EventEntity, (event) => event.participants, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "event_id" })
  event!: EventEntity;

  @ManyToOne(() => UserEntity, (user) => user.participations, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: UserEntity;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
```

- [ ] **Step 7: Create TypeORM migration**

Create `api/src/db/migrations/2026042800000-InitEventsHub.ts`:

```ts
import { MigrationInterface, QueryRunner } from "typeorm";

export class InitEventsHub2026042800000 implements MigrationInterface {
  name = "InitEventsHub2026042800000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(120) NOT NULL UNIQUE,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "events" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "title" varchar(160) NOT NULL,
        "description" text NOT NULL,
        "starts_at" timestamptz NOT NULL,
        "location" varchar(200) NOT NULL,
        "created_by_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "event_participants" (
        "event_id" uuid NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY ("event_id", "user_id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "event_participants"`);
    await queryRunner.query(`DROP TABLE "events"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
```

- [ ] **Step 8: Create TypeORM DataSource**

Create `api/src/db/data-source.ts`:

```ts
import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "../config/env";
import { EventParticipantEntity } from "./entities/event-participant.entity";
import { EventEntity } from "./entities/event.entity";
import { UserEntity } from "./entities/user.entity";
import { InitEventsHub2026042800000 } from "./migrations/2026042800000-InitEventsHub";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: env.databaseUrl,
  synchronize: false,
  logging: false,
  entities: [UserEntity, EventEntity, EventParticipantEntity],
  migrations: [InitEventsHub2026042800000],
});
```

- [ ] **Step 9: Run API typecheck and migration**

Run:

```bash
pnpm typecheck
pnpm db:migrate
```

Expected: `pnpm typecheck` passes, and `pnpm db:migrate` creates `users`, `events`, and `event_participants` in PostgreSQL.

- [ ] **Step 10: Commit checkpoint if commits are approved**

Only if the user has explicitly approved commits and the folder is a git repository, run:

```bash
git add api/package.json api/pnpm-lock.yaml api/tsconfig.json api/src api/.env.example
git commit -m "feat: add api database schema"
```

Expected: a commit is created. If commits are not approved, skip this step.

---

### Task 3: API Routes With Endpoint Tests

**Files:**
- Create: `api/src/domain/models.ts`
- Create: `api/src/domain/eventsRepository.ts`
- Create: `api/src/http/app.ts`
- Create: `api/test/app.test.ts`

- [ ] **Step 1: Write failing endpoint tests**

Create `api/test/app.test.ts`:

```ts
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { createApp } from "../src/http/app";
import type {
  CreateEventInput,
  DemoUserResult,
  EventDetails,
  EventSummary,
  EventsRepository,
  User,
} from "../src/domain/eventsRepository";

class MemoryEventsRepository implements EventsRepository {
  private users: User[] = [];
  private events: EventDetails[] = [];

  async createOrFindDemoUser(name: string): Promise<DemoUserResult> {
    const normalizedName = name.trim();
    const existing = this.users.find((user) => user.name === normalizedName);

    if (existing) {
      return { user: existing, created: false };
    }

    const user: User = {
      id: randomUUID(),
      name: normalizedName,
      createdAt: new Date().toISOString(),
    };

    this.users.push(user);
    return { user, created: true };
  }

  async listEvents(): Promise<EventSummary[]> {
    return this.events.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      startsAt: event.startsAt,
      location: event.location,
      createdBy: event.createdBy,
      participantCount: event.participants.length,
    }));
  }

  async createEvent(input: CreateEventInput): Promise<EventDetails | null> {
    const user = this.users.find((candidate) => candidate.id === input.userId);

    if (!user) {
      return null;
    }

    const event: EventDetails = {
      id: randomUUID(),
      title: input.title,
      description: input.description,
      startsAt: input.startsAt,
      location: input.location,
      createdBy: user,
      participants: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.events.push(event);
    return event;
  }

  async getEventDetails(eventId: string): Promise<EventDetails | null> {
    return this.events.find((event) => event.id === eventId) ?? null;
  }

  async joinEvent(eventId: string, userId: string): Promise<EventDetails | null> {
    const event = this.events.find((candidate) => candidate.id === eventId);
    const user = this.users.find((candidate) => candidate.id === userId);

    if (!event || !user) {
      return null;
    }

    if (!event.participants.some((participant) => participant.id === user.id)) {
      event.participants.push(user);
    }

    return event;
  }

  async leaveEvent(eventId: string, userId: string): Promise<EventDetails | null> {
    const event = this.events.find((candidate) => candidate.id === eventId);
    const user = this.users.find((candidate) => candidate.id === userId);

    if (!event || !user) {
      return null;
    }

    event.participants = event.participants.filter((participant) => participant.id !== user.id);
    return event;
  }
}

test("demo users are created once by name", async (t) => {
  const app = await createApp({ eventsRepository: new MemoryEventsRepository() });
  t.after(async () => app.close());

  const firstResponse = await app.inject({
    method: "POST",
    url: "/users/demo",
    payload: { name: "Alex" },
  });
  const secondResponse = await app.inject({
    method: "POST",
    url: "/users/demo",
    payload: { name: "Alex" },
  });

  assert.equal(firstResponse.statusCode, 201);
  assert.equal(secondResponse.statusCode, 200);
  assert.equal(firstResponse.json().id, secondResponse.json().id);
});

test("events can be created, listed, joined, and left", async (t) => {
  const app = await createApp({ eventsRepository: new MemoryEventsRepository() });
  t.after(async () => app.close());

  const userResponse = await app.inject({
    method: "POST",
    url: "/users/demo",
    payload: { name: "Mira" },
  });
  const user = userResponse.json() as User;

  const createResponse = await app.inject({
    method: "POST",
    url: "/events",
    headers: { "x-user-id": user.id },
    payload: {
      title: "Community Picnic",
      description: "Food, games, and meeting neighbors.",
      startsAt: "2026-05-20T17:00:00.000Z",
      location: "Central Park",
    },
  });
  const createdEvent = createResponse.json() as EventDetails;

  assert.equal(createResponse.statusCode, 201);
  assert.equal(createdEvent.title, "Community Picnic");

  const listResponse = await app.inject({ method: "GET", url: "/events" });
  assert.equal(listResponse.statusCode, 200);
  assert.equal(listResponse.json()[0].participantCount, 0);

  const joinResponse = await app.inject({
    method: "POST",
    url: `/events/${createdEvent.id}/join`,
    headers: { "x-user-id": user.id },
  });
  assert.equal(joinResponse.statusCode, 200);
  assert.equal(joinResponse.json().participants.length, 1);

  const leaveResponse = await app.inject({
    method: "DELETE",
    url: `/events/${createdEvent.id}/join`,
    headers: { "x-user-id": user.id },
  });
  assert.equal(leaveResponse.statusCode, 200);
  assert.equal(leaveResponse.json().participants.length, 0);
});

test("creating an event requires a user header", async (t) => {
  const app = await createApp({ eventsRepository: new MemoryEventsRepository() });
  t.after(async () => app.close());

  const response = await app.inject({
    method: "POST",
    url: "/events",
    payload: {
      title: "No Owner Event",
      description: "This request is missing X-User-Id.",
      startsAt: "2026-05-20T17:00:00.000Z",
      location: "Nowhere",
    },
  });

  assert.equal(response.statusCode, 400);
  assert.equal(response.json().message, "X-User-Id header is required");
});
```

- [ ] **Step 2: Run tests to verify they fail before implementation**

Run:

```bash
pnpm test
```

Expected: FAIL because `../src/http/app` and domain files do not exist yet.

- [ ] **Step 3: Create domain models and repository interface**

Create `api/src/domain/models.ts`:

```ts
export type User = {
  id: string;
  name: string;
  createdAt: string;
};

export type EventSummary = {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  location: string;
  createdBy: User;
  participantCount: number;
};

export type EventDetails = EventSummary & {
  participants: User[];
  createdAt: string;
  updatedAt: string;
};

export type CreateEventInput = {
  userId: string;
  title: string;
  description: string;
  startsAt: string;
  location: string;
};
```

Create `api/src/domain/eventsRepository.ts`:

```ts
export type { CreateEventInput, EventDetails, EventSummary, User } from "./models";
import type { CreateEventInput, EventDetails, EventSummary, User } from "./models";

export type DemoUserResult = {
  user: User;
  created: boolean;
};

export type EventsRepository = {
  createOrFindDemoUser(name: string): Promise<DemoUserResult>;
  listEvents(): Promise<EventSummary[]>;
  createEvent(input: CreateEventInput): Promise<EventDetails | null>;
  getEventDetails(eventId: string): Promise<EventDetails | null>;
  joinEvent(eventId: string, userId: string): Promise<EventDetails | null>;
  leaveEvent(eventId: string, userId: string): Promise<EventDetails | null>;
};
```

- [ ] **Step 4: Create Fastify app routes**

Create `api/src/http/app.ts`:

```ts
import jwt from "@fastify/jwt";
import Fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import { env } from "../config/env";
import type { CreateEventInput, EventsRepository } from "../domain/eventsRepository";

type AppDependencies = {
  eventsRepository: EventsRepository;
};

type DemoUserBody = {
  name?: unknown;
};

type CreateEventBody = {
  title?: unknown;
  description?: unknown;
  startsAt?: unknown;
  location?: unknown;
};

type EventParams = {
  id: string;
};

function sendBadRequest(reply: FastifyReply, message: string) {
  return reply.code(400).send({ message });
}

function getRequiredUserId(request: FastifyRequest, reply: FastifyReply): string | null {
  const rawUserId = request.headers["x-user-id"];
  const userId = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;

  if (!userId || !userId.trim()) {
    sendBadRequest(reply, "X-User-Id header is required");
    return null;
  }

  return userId.trim();
}

function readRequiredText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readIsoDate(value: unknown): string | null {
  const text = readRequiredText(value);

  if (!text || Number.isNaN(Date.parse(text))) {
    return null;
  }

  return new Date(text).toISOString();
}

export async function createApp({ eventsRepository }: AppDependencies) {
  const app = Fastify({ logger: true });

  await app.register(jwt, { secret: env.jwtSecret });

  app.post<{ Body: DemoUserBody }>("/users/demo", async (request, reply) => {
    const name = readRequiredText(request.body.name);

    if (!name) {
      return sendBadRequest(reply, "Name is required");
    }

    const result = await eventsRepository.createOrFindDemoUser(name);
    return reply.code(result.created ? 201 : 200).send(result.user);
  });

  app.get("/events", async () => eventsRepository.listEvents());

  app.post<{ Body: CreateEventBody }>("/events", async (request, reply) => {
    const userId = getRequiredUserId(request, reply);

    if (!userId) {
      return reply;
    }

    const title = readRequiredText(request.body.title);
    const description = readRequiredText(request.body.description);
    const startsAt = readIsoDate(request.body.startsAt);
    const location = readRequiredText(request.body.location);

    if (!title) {
      return sendBadRequest(reply, "Title is required");
    }

    if (!description) {
      return sendBadRequest(reply, "Description is required");
    }

    if (!startsAt) {
      return sendBadRequest(reply, "Valid startsAt is required");
    }

    if (!location) {
      return sendBadRequest(reply, "Location is required");
    }

    const input: CreateEventInput = { userId, title, description, startsAt, location };
    const event = await eventsRepository.createEvent(input);

    if (!event) {
      return reply.code(404).send({ message: "User not found" });
    }

    return reply.code(201).send(event);
  });

  app.get<{ Params: EventParams }>("/events/:id", async (request, reply) => {
    const event = await eventsRepository.getEventDetails(request.params.id);

    if (!event) {
      return reply.code(404).send({ message: "Event not found" });
    }

    return event;
  });

  app.post<{ Params: EventParams }>("/events/:id/join", async (request, reply) => {
    const userId = getRequiredUserId(request, reply);

    if (!userId) {
      return reply;
    }

    const event = await eventsRepository.joinEvent(request.params.id, userId);

    if (!event) {
      return reply.code(404).send({ message: "Event or user not found" });
    }

    return event;
  });

  app.delete<{ Params: EventParams }>("/events/:id/join", async (request, reply) => {
    const userId = getRequiredUserId(request, reply);

    if (!userId) {
      return reply;
    }

    const event = await eventsRepository.leaveEvent(request.params.id, userId);

    if (!event) {
      return reply.code(404).send({ message: "Event or user not found" });
    }

    return event;
  });

  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);
    return reply.code(500).send({ message: "Internal server error" });
  });

  return app;
}
```

- [ ] **Step 5: Run endpoint tests**

Run:

```bash
pnpm test
```

Expected: PASS for demo user creation, event creation/listing, join/leave, and missing `X-User-Id` validation.

- [ ] **Step 6: Run API typecheck**

Run:

```bash
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit checkpoint if commits are approved**

Only if the user has explicitly approved commits and the folder is a git repository, run:

```bash
git add api/src/domain api/src/http api/test api/package.json api/pnpm-lock.yaml
git commit -m "feat: add events api routes"
```

Expected: a commit is created. If commits are not approved, skip this step.

---

### Task 4: TypeORM Repository And API Server Entrypoint

**Files:**
- Create: `api/src/db/typeormEventsRepository.ts`
- Create: `api/src/server.ts`

- [ ] **Step 1: Write TypeORM repository implementation**

Create `api/src/db/typeormEventsRepository.ts`:

```ts
import type { DataSource, Repository } from "typeorm";
import type {
  CreateEventInput,
  DemoUserResult,
  EventDetails,
  EventSummary,
  EventsRepository,
  User,
} from "../domain/eventsRepository";
import { EventParticipantEntity } from "./entities/event-participant.entity";
import { EventEntity } from "./entities/event.entity";
import { UserEntity } from "./entities/user.entity";

export class TypeOrmEventsRepository implements EventsRepository {
  private readonly users: Repository<UserEntity>;
  private readonly events: Repository<EventEntity>;
  private readonly participants: Repository<EventParticipantEntity>;

  constructor(dataSource: DataSource) {
    this.users = dataSource.getRepository(UserEntity);
    this.events = dataSource.getRepository(EventEntity);
    this.participants = dataSource.getRepository(EventParticipantEntity);
  }

  async createOrFindDemoUser(name: string): Promise<DemoUserResult> {
    const normalizedName = name.trim();
    const existing = await this.users.findOne({ where: { name: normalizedName } });

    if (existing) {
      return { user: this.toUser(existing), created: false };
    }

    const user = await this.users.save(this.users.create({ name: normalizedName }));
    return { user: this.toUser(user), created: true };
  }

  async listEvents(): Promise<EventSummary[]> {
    const rows = await this.events
      .createQueryBuilder("event")
      .leftJoin("event.createdBy", "createdBy")
      .leftJoin("event.participants", "participant")
      .select("event.id", "id")
      .addSelect("event.title", "title")
      .addSelect("event.description", "description")
      .addSelect("event.startsAt", "startsAt")
      .addSelect("event.location", "location")
      .addSelect("createdBy.id", "createdById")
      .addSelect("createdBy.name", "createdByName")
      .addSelect("createdBy.createdAt", "createdByCreatedAt")
      .addSelect("COUNT(participant.userId)", "participantCount")
      .groupBy("event.id")
      .addGroupBy("createdBy.id")
      .orderBy("event.startsAt", "ASC")
      .getRawMany<{
        id: string;
        title: string;
        description: string;
        startsAt: Date;
        location: string;
        createdById: string;
        createdByName: string;
        createdByCreatedAt: Date;
        participantCount: string;
      }>();

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      startsAt: new Date(row.startsAt).toISOString(),
      location: row.location,
      createdBy: {
        id: row.createdById,
        name: row.createdByName,
        createdAt: new Date(row.createdByCreatedAt).toISOString(),
      },
      participantCount: Number(row.participantCount),
    }));
  }

  async createEvent(input: CreateEventInput): Promise<EventDetails | null> {
    const creator = await this.users.findOne({ where: { id: input.userId } });

    if (!creator) {
      return null;
    }

    const event = await this.events.save(
      this.events.create({
        title: input.title,
        description: input.description,
        startsAt: new Date(input.startsAt),
        location: input.location,
        createdByUserId: input.userId,
      }),
    );

    return this.getEventDetails(event.id);
  }

  async getEventDetails(eventId: string): Promise<EventDetails | null> {
    const event = await this.events.findOne({
      where: { id: eventId },
      relations: {
        createdBy: true,
        participants: {
          user: true,
        },
      },
    });

    if (!event) {
      return null;
    }

    return this.toEventDetails(event);
  }

  async joinEvent(eventId: string, userId: string): Promise<EventDetails | null> {
    const [event, user] = await Promise.all([
      this.events.findOne({ where: { id: eventId } }),
      this.users.findOne({ where: { id: userId } }),
    ]);

    if (!event || !user) {
      return null;
    }

    const existing = await this.participants.findOne({ where: { eventId, userId } });

    if (!existing) {
      await this.participants.save(this.participants.create({ eventId, userId }));
    }

    return this.getEventDetails(eventId);
  }

  async leaveEvent(eventId: string, userId: string): Promise<EventDetails | null> {
    const [event, user] = await Promise.all([
      this.events.findOne({ where: { id: eventId } }),
      this.users.findOne({ where: { id: userId } }),
    ]);

    if (!event || !user) {
      return null;
    }
    await this.participants.delete({ eventId, userId });
    return this.getEventDetails(eventId);
  }

  private toUser(user: UserEntity): User {
    return {
      id: user.id,
      name: user.name,
      createdAt: user.createdAt.toISOString(),
    };
  }

  private toEventDetails(event: EventEntity): EventDetails {
    const participants = [...event.participants]
      .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime())
      .map((participant) => this.toUser(participant.user));

    return {
      id: event.id,
      title: event.title,
      description: event.description,
      startsAt: event.startsAt.toISOString(),
      location: event.location,
      createdBy: this.toUser(event.createdBy),
      participantCount: participants.length,
      participants,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    };
  }
}
```

- [ ] **Step 2: Create API server entrypoint**

Create `api/src/server.ts`:

```ts
import { env } from "./config/env";
import { AppDataSource } from "./db/data-source";
import { TypeOrmEventsRepository } from "./db/typeormEventsRepository";
import { createApp } from "./http/app";

async function main() {
  await AppDataSource.initialize();
  const eventsRepository = new TypeOrmEventsRepository(AppDataSource);
  const app = await createApp({ eventsRepository });

  await app.listen({ host: env.host, port: env.port });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

- [ ] **Step 3: Run API checks**

Run:

```bash
pnpm typecheck
pnpm test
```

Expected: both commands pass.

- [ ] **Step 4: Run database-backed API smoke test**

Run the API in one terminal:

```bash
pnpm dev
```

Run these requests in another terminal:

```bash
curl -s -X POST http://localhost:3000/users/demo -H 'Content-Type: application/json' -d '{"name":"Alex"}'
curl -s http://localhost:3000/events
```

Expected: the first request returns a user object with `id`, `name`, and `createdAt`; the second request returns an array.

- [ ] **Step 5: Commit checkpoint if commits are approved**

Only if the user has explicitly approved commits and the folder is a git repository, run:

```bash
git add api/src/db/typeormEventsRepository.ts api/src/server.ts
git commit -m "feat: connect api routes to postgres"
```

Expected: a commit is created. If commits are not approved, skip this step.

---

### Task 5: Web Package, API Client, And Zustand Stores

**Files:**
- Create: `web/package.json`
- Create: `web/tsconfig.json`
- Create: `web/index.html`
- Create: `web/vite.config.ts`
- Create: `web/src/main.tsx`
- Create: `web/src/App.tsx`
- Create: `web/src/index.css`
- Create: `web/src/types.ts`
- Create: `web/src/api/client.ts`
- Create: `web/src/stores/sessionStore.ts`
- Create: `web/src/stores/eventsStore.ts`

- [ ] **Step 1: Create web package scripts**

Create `web/package.json`:

```json
{
  "name": "events-hub-web",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "typecheck": "tsc --noEmit",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview"
  },
  "dependencies": {},
  "devDependencies": {}
}
```

- [ ] **Step 2: Install web runtime dependencies at latest**

Run:

```bash
pnpm add react@latest react-dom@latest react-router-dom@latest zustand@latest
```

Expected: `web/package.json` contains these packages under `dependencies` with current latest versions.

- [ ] **Step 3: Install web development dependencies at latest**

Run:

```bash
pnpm add -D @vitejs/plugin-react@latest vite@latest typescript@latest tailwindcss@latest @tailwindcss/vite@latest @types/react@latest @types/react-dom@latest
```

Expected: `web/package.json` contains these packages under `devDependencies` with current latest versions.

- [ ] **Step 4: Create web config files**

Create `web/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "references": []
}
```

Create `web/vite.config.ts`:

```ts
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
```

Create `web/index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Events Hub</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Create frontend types and API client**

Create `web/src/types.ts`:

```ts
export type User = {
  id: string;
  name: string;
  createdAt: string;
};

export type EventSummary = {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  location: string;
  createdBy: User;
  participantCount: number;
};

export type EventDetails = EventSummary & {
  participants: User[];
  createdAt: string;
  updatedAt: string;
};

export type CreateEventPayload = {
  title: string;
  description: string;
  startsAt: string;
  location: string;
};
```

Create `web/src/api/client.ts`:

```ts
import type { CreateEventPayload, EventDetails, EventSummary, User } from "../types";

const API_BASE = "/api";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit & { userId?: string } = {}): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (options.userId) {
    headers.set("X-User-Id", options.userId);
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data && typeof data.message === "string" ? data.message : "Request failed";
    throw new ApiError(message, response.status);
  }

  return data as T;
}

export const apiClient = {
  createDemoUser(name: string) {
    return request<User>("/users/demo", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  },

  listEvents() {
    return request<EventSummary[]>("/events");
  },

  createEvent(userId: string, payload: CreateEventPayload) {
    return request<EventDetails>("/events", {
      method: "POST",
      userId,
      body: JSON.stringify(payload),
    });
  },

  getEventDetails(eventId: string) {
    return request<EventDetails>(`/events/${eventId}`);
  },

  joinEvent(eventId: string, userId: string) {
    return request<EventDetails>(`/events/${eventId}/join`, {
      method: "POST",
      userId,
    });
  },

  leaveEvent(eventId: string, userId: string) {
    return request<EventDetails>(`/events/${eventId}/join`, {
      method: "DELETE",
      userId,
    });
  },
};
```

- [ ] **Step 6: Create Zustand stores**

Create `web/src/stores/sessionStore.ts`:

```ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiClient } from "../api/client";
import type { User } from "../types";

type SessionState = {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  signIn: (name: string) => Promise<void>;
  signOut: () => void;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      error: null,

      async signIn(name) {
        set({ isLoading: true, error: null });

        try {
          const user = await apiClient.createDemoUser(name);
          set({ user, isLoading: false });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : "Could not sign in",
          });
        }
      },

      signOut() {
        set({ user: null, error: null });
      },
    }),
    {
      name: "events-hub-session",
      partialize: (state) => ({ user: state.user }) as SessionState,
    },
  ),
);
```

Create `web/src/stores/eventsStore.ts`:

```ts
import { create } from "zustand";
import { apiClient } from "../api/client";
import type { CreateEventPayload, EventDetails, EventSummary } from "../types";

type EventsState = {
  events: EventSummary[];
  selectedEvent: EventDetails | null;
  isLoading: boolean;
  error: string | null;
  loadEvents: () => Promise<void>;
  loadEvent: (eventId: string) => Promise<void>;
  createEvent: (userId: string, payload: CreateEventPayload) => Promise<EventDetails | null>;
  joinEvent: (eventId: string, userId: string) => Promise<void>;
  leaveEvent: (eventId: string, userId: string) => Promise<void>;
};

export const useEventsStore = create<EventsState>((set) => ({
  events: [],
  selectedEvent: null,
  isLoading: false,
  error: null,

  async loadEvents() {
    set({ isLoading: true, error: null });

    try {
      const events = await apiClient.listEvents();
      set({ events, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Could not load events",
      });
    }
  },

  async loadEvent(eventId) {
    set({ isLoading: true, error: null });

    try {
      const selectedEvent = await apiClient.getEventDetails(eventId);
      set({ selectedEvent, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Could not load event",
      });
    }
  },

  async createEvent(userId, payload) {
    set({ isLoading: true, error: null });

    try {
      const event = await apiClient.createEvent(userId, payload);
      set({ selectedEvent: event, isLoading: false });
      return event;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Could not create event",
      });
      return null;
    }
  },

  async joinEvent(eventId, userId) {
    set({ error: null });

    try {
      const selectedEvent = await apiClient.joinEvent(eventId, userId);
      set({ selectedEvent });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Could not join event" });
    }
  },

  async leaveEvent(eventId, userId) {
    set({ error: null });

    try {
      const selectedEvent = await apiClient.leaveEvent(eventId, userId);
      set({ selectedEvent });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Could not leave event" });
    }
  },
}));
```

- [ ] **Step 7: Create minimal React entry and route shell**

Create `web/src/main.tsx`:

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
```

Create `web/src/App.tsx`:

```tsx
import { Navigate, Route, Routes } from "react-router-dom";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<div>Events Hub</div>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
```

Create `web/src/index.css`:

```css
@import "tailwindcss";

:root {
  color: #172033;
  background: #f6f2ea;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

body {
  min-width: 320px;
  min-height: 100vh;
  margin: 0;
}

button,
input,
textarea {
  font: inherit;
}
```

- [ ] **Step 8: Run web typecheck**

Run:

```bash
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 9: Commit checkpoint if commits are approved**

Only if the user has explicitly approved commits and the folder is a git repository, run:

```bash
git add web/package.json web/pnpm-lock.yaml web/tsconfig.json web/index.html web/vite.config.ts web/src
git commit -m "feat: scaffold web app state and api client"
```

Expected: a commit is created. If commits are not approved, skip this step.

---

### Task 6: Web Pages And User Flow

**Files:**
- Create: `web/src/components/Layout.tsx`
- Create: `web/src/pages/HomePage.tsx`
- Create: `web/src/pages/EventsListPage.tsx`
- Create: `web/src/pages/NewEventPage.tsx`
- Create: `web/src/pages/EventDetailsPage.tsx`
- Modify: `web/src/App.tsx`
- Modify: `web/src/index.css`

- [ ] **Step 1: Create shared layout**

Create `web/src/components/Layout.tsx`:

```tsx
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useSessionStore } from "../stores/sessionStore";

export function Layout() {
  const navigate = useNavigate();
  const user = useSessionStore((state) => state.user);
  const signOut = useSessionStore((state) => state.signOut);

  return (
    <div className="min-h-screen bg-[#f6f2ea] text-slate-900">
      <header className="border-b border-slate-900/10 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/events" className="text-xl font-black tracking-tight text-slate-950">
            Events Hub
          </Link>
          <nav className="flex items-center gap-3 text-sm font-semibold">
            {user ? <span className="hidden text-slate-600 sm:inline">{user.name}</span> : null}
            <Link to="/events/new" className="rounded-full bg-slate-950 px-4 py-2 text-white shadow-sm">
              Create event
            </Link>
            {user ? (
              <button
                type="button"
                onClick={() => {
                  signOut();
                  navigate("/");
                }}
                className="rounded-full border border-slate-300 px-4 py-2 text-slate-700"
              >
                Sign out
              </button>
            ) : null}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Create demo-user entry page**

Create `web/src/pages/HomePage.tsx`:

```tsx
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSessionStore } from "../stores/sessionStore";

export function HomePage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const signIn = useSessionStore((state) => state.signIn);
  const isLoading = useSessionStore((state) => state.isLoading);
  const error = useSessionStore((state) => state.error);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      return;
    }

    await signIn(name);
    navigate("/events");
  }

  return (
    <section className="grid min-h-[70vh] items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
      <div>
        <p className="mb-4 text-sm font-bold uppercase tracking-[0.25em] text-orange-600">Local events</p>
        <h1 className="max-w-3xl text-5xl font-black leading-tight tracking-tight text-slate-950 sm:text-7xl">
          Find the room where things are happening.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700">
          Create small gatherings, discover what others are hosting, and join events as a demo user.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-[2rem] bg-white p-6 shadow-2xl shadow-slate-900/10">
        <h2 className="text-2xl font-black text-slate-950">Enter as demo user</h2>
        <p className="mt-2 text-sm text-slate-600">No password needed for this MVP.</p>
        <label className="mt-6 block text-sm font-bold text-slate-700" htmlFor="name">
          Your name
        </label>
        <input
          id="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none focus:border-orange-500"
          autoComplete="name"
        />
        {error ? <p className="mt-3 text-sm font-semibold text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={isLoading || !name.trim()}
          className="mt-6 w-full rounded-2xl bg-orange-600 px-5 py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Entering..." : "Continue"}
        </button>
      </form>
    </section>
  );
}
```

- [ ] **Step 3: Create events list page**

Create `web/src/pages/EventsListPage.tsx`:

```tsx
import { useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { useEventsStore } from "../stores/eventsStore";
import { useSessionStore } from "../stores/sessionStore";

export function EventsListPage() {
  const user = useSessionStore((state) => state.user);
  const events = useEventsStore((state) => state.events);
  const isLoading = useEventsStore((state) => state.isLoading);
  const error = useEventsStore((state) => state.error);
  const loadEvents = useEventsStore((state) => state.loadEvents);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <section>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-orange-600">Events</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">What is coming up</h1>
        </div>
        <Link to="/events/new" className="rounded-full bg-orange-600 px-5 py-3 text-center font-black text-white">
          Create event
        </Link>
      </div>

      {isLoading ? <p className="mt-8 text-slate-600">Loading events...</p> : null}
      {error ? <p className="mt-8 rounded-2xl bg-red-50 p-4 font-semibold text-red-700">{error}</p> : null}

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {events.map((event) => (
          <Link
            key={event.id}
            to={`/events/${event.id}`}
            className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-950">{event.title}</h2>
                <p className="mt-2 line-clamp-2 text-slate-600">{event.description}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">
                {event.participantCount} joined
              </span>
            </div>
            <div className="mt-6 grid gap-2 text-sm font-semibold text-slate-600">
              <span>{new Date(event.startsAt).toLocaleString()}</span>
              <span>{event.location}</span>
              <span>Hosted by {event.createdBy.name}</span>
            </div>
          </Link>
        ))}
      </div>

      {!isLoading && events.length === 0 ? (
        <div className="mt-8 rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center">
          <h2 className="text-2xl font-black text-slate-950">No events yet</h2>
          <p className="mt-2 text-slate-600">Create the first event for the community.</p>
        </div>
      ) : null}
    </section>
  );
}
```

- [ ] **Step 4: Create new event page**

Create `web/src/pages/NewEventPage.tsx`:

```tsx
import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useEventsStore } from "../stores/eventsStore";
import { useSessionStore } from "../stores/sessionStore";

export function NewEventPage() {
  const navigate = useNavigate();
  const user = useSessionStore((state) => state.user);
  const createEvent = useEventsStore((state) => state.createEvent);
  const isLoading = useEventsStore((state) => state.isLoading);
  const error = useEventsStore((state) => state.error);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [location, setLocation] = useState("");

  if (!user) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user || !title.trim() || !description.trim() || !startsAt || !location.trim()) {
      return;
    }

    const createdEvent = await createEvent(user.id, {
      title,
      description,
      startsAt: new Date(startsAt).toISOString(),
      location,
    });

    if (createdEvent) {
      navigate(`/events/${createdEvent.id}`);
    }
  }

  return (
    <section className="mx-auto max-w-3xl">
      <p className="text-sm font-bold uppercase tracking-[0.25em] text-orange-600">Create</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">Host a new event</h1>
      <form onSubmit={handleSubmit} className="mt-8 rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-900/10">
        <div className="grid gap-5">
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Title
            <input value={title} onChange={(event) => setTitle(event.target.value)} className="rounded-2xl border border-slate-300 px-4 py-3" />
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Description
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={5} className="rounded-2xl border border-slate-300 px-4 py-3" />
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Date and time
            <input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} className="rounded-2xl border border-slate-300 px-4 py-3" />
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Location
            <input value={location} onChange={(event) => setLocation(event.target.value)} className="rounded-2xl border border-slate-300 px-4 py-3" />
          </label>
        </div>
        {error ? <p className="mt-4 rounded-2xl bg-red-50 p-3 font-semibold text-red-700">{error}</p> : null}
        <button disabled={isLoading} className="mt-6 rounded-2xl bg-slate-950 px-6 py-3 font-black text-white disabled:opacity-50">
          {isLoading ? "Creating..." : "Create event"}
        </button>
      </form>
    </section>
  );
}
```

- [ ] **Step 5: Create event details page**

Create `web/src/pages/EventDetailsPage.tsx`:

```tsx
import { useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useEventsStore } from "../stores/eventsStore";
import { useSessionStore } from "../stores/sessionStore";

export function EventDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const user = useSessionStore((state) => state.user);
  const selectedEvent = useEventsStore((state) => state.selectedEvent);
  const isLoading = useEventsStore((state) => state.isLoading);
  const error = useEventsStore((state) => state.error);
  const loadEvent = useEventsStore((state) => state.loadEvent);
  const joinEvent = useEventsStore((state) => state.joinEvent);
  const leaveEvent = useEventsStore((state) => state.leaveEvent);

  useEffect(() => {
    if (id) {
      void loadEvent(id);
    }
  }, [id, loadEvent]);

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!id) {
    return <Navigate to="/events" replace />;
  }

  const isParticipant = selectedEvent?.participants.some((participant) => participant.id === user.id) ?? false;

  return (
    <section>
      <Link to="/events" className="text-sm font-bold text-orange-700">
        Back to events
      </Link>

      {isLoading ? <p className="mt-8 text-slate-600">Loading event...</p> : null}
      {error ? <p className="mt-8 rounded-2xl bg-red-50 p-4 font-semibold text-red-700">{error}</p> : null}

      {selectedEvent ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <article className="rounded-[2rem] bg-white p-8 shadow-xl shadow-slate-900/10">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-orange-600">Event</p>
            <h1 className="mt-2 text-5xl font-black tracking-tight text-slate-950">{selectedEvent.title}</h1>
            <p className="mt-6 whitespace-pre-line text-lg leading-8 text-slate-700">{selectedEvent.description}</p>
            <dl className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-100 p-4">
                <dt className="text-xs font-black uppercase tracking-wider text-slate-500">When</dt>
                <dd className="mt-1 font-bold">{new Date(selectedEvent.startsAt).toLocaleString()}</dd>
              </div>
              <div className="rounded-2xl bg-slate-100 p-4">
                <dt className="text-xs font-black uppercase tracking-wider text-slate-500">Where</dt>
                <dd className="mt-1 font-bold">{selectedEvent.location}</dd>
              </div>
              <div className="rounded-2xl bg-slate-100 p-4">
                <dt className="text-xs font-black uppercase tracking-wider text-slate-500">Host</dt>
                <dd className="mt-1 font-bold">{selectedEvent.createdBy.name}</dd>
              </div>
            </dl>
          </article>

          <aside className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl shadow-slate-900/20">
            <h2 className="text-2xl font-black">Participants</h2>
            <p className="mt-1 text-sm text-slate-300">{selectedEvent.participants.length} joined</p>
            <button
              type="button"
              onClick={() => {
                if (isParticipant) {
                  void leaveEvent(selectedEvent.id, user.id);
                } else {
                  void joinEvent(selectedEvent.id, user.id);
                }
              }}
              className="mt-6 w-full rounded-2xl bg-orange-500 px-5 py-3 font-black text-white"
            >
              {isParticipant ? "Leave event" : "Join event"}
            </button>
            <div className="mt-6 grid gap-3">
              {selectedEvent.participants.map((participant) => (
                <div key={participant.id} className="rounded-2xl bg-white/10 px-4 py-3 font-bold">
                  {participant.name}
                </div>
              ))}
              {selectedEvent.participants.length === 0 ? <p className="text-sm text-slate-300">No participants yet.</p> : null}
            </div>
          </aside>
        </div>
      ) : null}
    </section>
  );
}
```

- [ ] **Step 6: Wire routes into App**

Replace `web/src/App.tsx`:

```tsx
import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { EventDetailsPage } from "./pages/EventDetailsPage";
import { EventsListPage } from "./pages/EventsListPage";
import { HomePage } from "./pages/HomePage";
import { NewEventPage } from "./pages/NewEventPage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route element={<Layout />}>
        <Route path="/events" element={<EventsListPage />} />
        <Route path="/events/new" element={<NewEventPage />} />
        <Route path="/events/:id" element={<EventDetailsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
```

- [ ] **Step 7: Add reusable responsive CSS helpers**

Append to `web/src/index.css`:

```css
::selection {
  color: #fff;
  background: #ea580c;
}

a {
  color: inherit;
  text-decoration: none;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

- [ ] **Step 8: Run web checks**

Run:

```bash
pnpm typecheck
pnpm build
```

Expected: both commands pass and Vite creates `web/dist`.

- [ ] **Step 9: Commit checkpoint if commits are approved**

Only if the user has explicitly approved commits and the folder is a git repository, run:

```bash
git add web/src
git commit -m "feat: add events web flow"
```

Expected: a commit is created. If commits are not approved, skip this step.

---

### Task 7: End-To-End Verification And Documentation

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Run full dependency installation**

Run:

```bash
cd api && pnpm install
cd ../web && pnpm install
```

Expected: both installs complete successfully.

- [ ] **Step 2: Run API verification**

Run:

```bash
cd api
pnpm typecheck
pnpm test
```

Expected: both commands pass.

- [ ] **Step 3: Run web verification**

Run:

```bash
cd web
pnpm typecheck
pnpm build
```

Expected: both commands pass.

- [ ] **Step 4: Run the full local stack**

Run PostgreSQL:

```bash
docker compose up -d
```

Run API:

```bash
cd api
pnpm db:migrate
pnpm dev
```

Run web:

```bash
cd web
pnpm dev
```

Expected: API listens on `http://localhost:3000`; web app listens on `http://localhost:5173`.

- [ ] **Step 5: Manually verify core MVP flow**

In the browser at `http://localhost:5173`, verify:

1. Enter a demo-user name and continue to `/events`.
2. Create an event from `/events/new`.
3. Confirm the app navigates to the new event details page.
4. Confirm event details show title, description, date, location, host, and participants.
5. Click `Join event` and confirm the current user appears under participants.
6. Click `Leave event` and confirm the current user is removed from participants.
7. Return to `/events` and confirm the event list loads.

- [ ] **Step 6: Update README with final verification commands**

Replace `README.md` with:

```markdown
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

## Verification

API:

```bash
cd api
pnpm typecheck
pnpm test
```

Web:

```bash
cd web
pnpm typecheck
pnpm build
```

Manual flow:

1. Enter a demo-user name.
2. Create an event.
3. Open the event details page.
4. Join the event.
5. Leave the event.
```

- [ ] **Step 7: Commit checkpoint if commits are approved**

Only if the user has explicitly approved commits and the folder is a git repository, run:

```bash
git add README.md
git commit -m "docs: document events hub development flow"
```

Expected: a commit is created. If commits are not approved, skip this step.

---

## Self-Review

Spec coverage:

- Demo-user sign-in: Task 3 API route and Task 6 home page.
- Event list: Task 3 API route and Task 6 list page.
- Event creation: Task 3 API route and Task 6 creation page.
- Event details: Task 3 API route and Task 6 details page.
- Join/leave: Task 3 API route and Task 6 details page.
- Participants display: Task 3 response shape and Task 6 details page.
- PostgreSQL through Docker Compose: Task 1 and Task 2.
- TypeORM with required server dependencies: Task 2 and Task 4.
- `X-User-Id` header: Task 3 API route and Task 5 API client.
- Basic loading and error states: Task 5 stores and Task 6 pages.
- Verification commands: Task 7.

Type consistency:

- API `User`, `EventSummary`, `EventDetails`, and `CreateEventInput` match frontend `User`, `EventSummary`, `EventDetails`, and `CreateEventPayload`.
- API routes return the same event shape consumed by the web client.
- Join and leave return updated event details so the UI can update participants without optimistic state.

Scope control:

- JWT and argon2 are installed, but full authentication, passwords, sessions, comments, chat, real-time, search, and RSVP statuses are not implemented.
