import jwt from "@fastify/jwt";
import argon2 from "argon2";
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";
import { env } from "../config/env";
import type { AuthRepository, AuthUser, User } from "../domain/authRepository";
import type { CreateEventInput, EventsRepository } from "../domain/eventsRepository";
import type { AuthSession } from "../domain/models";

type AppDependencies = {
  authRepository: AuthRepository;
  eventsRepository: EventsRepository;
  configureApp?: (app: FastifyInstance) => Promise<void> | void;
};

type AuthBody = {
  name?: unknown;
  password?: unknown;
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

const PASSWORD_MIN_LENGTH = 8;

function sendBadRequest(reply: FastifyReply, message: string) {
  return reply.code(400).send({ message });
}

function sendUnauthorized(reply: FastifyReply, message = "Authentication required") {
  return reply.code(401).send({ message });
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

function readPassword(value: unknown): string | null {
  if (typeof value !== "string" || value.length < PASSWORD_MIN_LENGTH) {
    return null;
  }

  return value;
}

function toPublicUser(user: AuthUser): User {
  return {
    id: user.id,
    name: user.name,
    createdAt: user.createdAt,
  };
}

function createAuthSession(app: FastifyInstance, user: User): AuthSession {
  return {
    user,
    token: app.jwt.sign({ sub: user.id }, { expiresIn: "7d" }),
  };
}

async function getAuthenticatedUser(
  request: FastifyRequest,
  reply: FastifyReply,
  authRepository: AuthRepository,
): Promise<User | null> {
  try {
    const payload = (await request.jwtVerify()) as { sub?: unknown };

    if (typeof payload.sub !== "string" || !payload.sub.trim()) {
      sendUnauthorized(reply);
      return null;
    }

    const user = await authRepository.findUserById(payload.sub);

    if (!user) {
      sendUnauthorized(reply);
      return null;
    }

    return user;
  } catch {
    sendUnauthorized(reply);
    return null;
  }
}

async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(passwordHash, password);
  } catch {
    return false;
  }
}

export async function createApp({ authRepository, eventsRepository, configureApp }: AppDependencies) {
  const app = Fastify({ logger: true });

  await configureApp?.(app);

  await app.register(jwt, { secret: env.jwtSecret });

  app.post<{ Body: AuthBody }>("/auth/register", async (request, reply) => {
    const name = readRequiredText(request.body.name);
    const password = readPassword(request.body.password);

    if (!name) {
      return sendBadRequest(reply, "Name is required");
    }

    if (!password) {
      return sendBadRequest(reply, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
    }

    const user = await authRepository.createUserWithPassword({
      name,
      passwordHash: await argon2.hash(password),
    });

    if (!user) {
      return reply.code(409).send({ message: "Name is already registered" });
    }

    return reply.code(201).send(createAuthSession(app, user));
  });

  app.post<{ Body: AuthBody }>("/auth/login", async (request, reply) => {
    const name = readRequiredText(request.body.name);
    const password = readPassword(request.body.password);

    if (!name) {
      return sendBadRequest(reply, "Name is required");
    }

    if (!password) {
      return sendBadRequest(reply, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
    }

    const user = await authRepository.findUserByNameWithPassword(name);

    if (!user || !(await verifyPassword(user.passwordHash, password))) {
      return sendUnauthorized(reply, "Invalid name or password");
    }

    return createAuthSession(app, toPublicUser(user));
  });

  app.get("/auth/me", async (request, reply) => {
    const user = await getAuthenticatedUser(request, reply, authRepository);

    if (!user) {
      return reply;
    }

    return user;
  });

  app.get("/events", async () => eventsRepository.listEvents());

  app.post<{ Body: CreateEventBody }>("/events", async (request, reply) => {
    const user = await getAuthenticatedUser(request, reply, authRepository);

    if (!user) {
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

    const input: CreateEventInput = { userId: user.id, title, description, startsAt, location };
    const event = await eventsRepository.createEvent(input);

    if (!event) {
      return sendUnauthorized(reply);
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
    const user = await getAuthenticatedUser(request, reply, authRepository);

    if (!user) {
      return reply;
    }

    const event = await eventsRepository.joinEvent(request.params.id, user.id);

    if (!event) {
      return reply.code(404).send({ message: "Event or user not found" });
    }

    return event;
  });

  app.delete<{ Params: EventParams }>("/events/:id/join", async (request, reply) => {
    const user = await getAuthenticatedUser(request, reply, authRepository);

    if (!user) {
      return reply;
    }

    const event = await eventsRepository.leaveEvent(request.params.id, user.id);

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
