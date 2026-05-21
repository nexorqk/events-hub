import jwt from "@fastify/jwt";
import { OAuth2Client } from "google-auth-library";
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";
import { env } from "../config/env";
import type { CreateEventInput, UpdateEventInput, User } from "../domain/models";
import type { AuthSession } from "../domain/models";
import type { EventsRepository } from "../domain/eventsRepository";
import type { TypeOrmUserRepository } from "../db/typeormUserRepository";

type AppDependencies = {
  userRepository: TypeOrmUserRepository;
  eventsRepository: EventsRepository;
  configureApp?: (app: FastifyInstance) => Promise<void> | void;
};

type DemoAuthBody = {
  name?: unknown;
};

type GoogleAuthBody = {
  credential?: unknown;
};

type CreateEventBody = {
  title?: unknown;
  description?: unknown;
  startsAt?: unknown;
  location?: unknown;
};

type UpdateEventBody = CreateEventBody;

type EventParams = {
  id: string;
};

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

function readEventInput(
  body: CreateEventBody,
  reply: FastifyReply,
): Omit<CreateEventInput, "userId"> | null {
  const title = readRequiredText(body.title);
  const description = readRequiredText(body.description);
  const startsAt = readIsoDate(body.startsAt);
  const location = readRequiredText(body.location);

  if (!title) {
    sendBadRequest(reply, "Title is required");
    return null;
  }

  if (!description) {
    sendBadRequest(reply, "Description is required");
    return null;
  }

  if (!startsAt) {
    sendBadRequest(reply, "Valid startsAt is required");
    return null;
  }

  if (!location) {
    sendBadRequest(reply, "Location is required");
    return null;
  }

  return { title, description, startsAt, location };
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
  userRepository: TypeOrmUserRepository,
): Promise<User | null> {
  try {
    const payload = (await request.jwtVerify()) as { sub?: unknown };

    if (typeof payload.sub !== "string" || !payload.sub.trim()) {
      sendUnauthorized(reply);
      return null;
    }

    const user = await userRepository.findById(payload.sub);

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

export async function createApp({ userRepository, eventsRepository, configureApp }: AppDependencies) {
  const app = Fastify({ logger: true });

  await configureApp?.(app);

  await app.register(jwt, { secret: env.jwtSecret });

  app.post<{ Body: DemoAuthBody }>("/auth/demo", async (request, reply) => {
    const name = readRequiredText(request.body.name);

    if (!name) {
      return sendBadRequest(reply, "Name is required");
    }

    const user = await userRepository.findOrCreateDemoUser({ name });
    return createAuthSession(app, user);
  });

  app.post<{ Body: GoogleAuthBody }>("/auth/google", async (request, reply) => {
    const credential = readRequiredText(request.body.credential);

    if (!credential) {
      return sendBadRequest(reply, "Google credential is required");
    }

    if (!env.googleClientId) {
      return reply.code(500).send({ message: "Google OAuth is not configured" });
    }

    const client = new OAuth2Client(env.googleClientId);
    let ticket;

    try {
      ticket = await client.verifyIdToken({
        idToken: credential,
        audience: env.googleClientId,
      });
    } catch {
      return sendUnauthorized(reply, "Invalid Google credential");
    }

    const payload = ticket.getPayload();

    if (!payload || !payload.sub) {
      return sendUnauthorized(reply, "Invalid Google credential");
    }

    const googleId = payload.sub;
    const name = payload.name ?? "Google User";
    const email = payload.email ?? undefined;
    const avatarUrl = payload.picture ?? undefined;

    const user = await userRepository.findOrCreateGoogleUser({
      googleId,
      name,
      email,
      avatarUrl,
    });

    return createAuthSession(app, user);
  });

  app.get("/auth/me", async (request, reply) => {
    const user = await getAuthenticatedUser(request, reply, userRepository);

    if (!user) {
      return reply;
    }

    return user;
  });

  app.get("/events", async () => eventsRepository.listEvents());

  app.post<{ Body: CreateEventBody }>("/events", async (request, reply) => {
    const user = await getAuthenticatedUser(request, reply, userRepository);

    if (!user) {
      return reply;
    }

    const eventInput = readEventInput(request.body, reply);

    if (!eventInput) {
      return reply;
    }

    const input: CreateEventInput = { userId: user.id, ...eventInput };
    const event = await eventsRepository.createEvent(input);

    if (!event) {
      return sendUnauthorized(reply);
    }

    return reply.code(201).send(event);
  });

  app.patch<{ Params: EventParams; Body: UpdateEventBody }>("/events/:id", async (request, reply) => {
    const user = await getAuthenticatedUser(request, reply, userRepository);

    if (!user) {
      return reply;
    }

    const eventInput = readEventInput(request.body, reply);

    if (!eventInput) {
      return reply;
    }

    const input: UpdateEventInput = { eventId: request.params.id, userId: user.id, ...eventInput };
    const result = await eventsRepository.updateEvent(input);

    if (result.status === "not_found") {
      return reply.code(404).send({ message: "Event not found" });
    }

    if (result.status === "forbidden") {
      return reply.code(403).send({ message: "Only the event host can edit this event" });
    }

    return result.event;
  });

  app.get<{ Params: EventParams }>("/events/:id", async (request, reply) => {
    const event = await eventsRepository.getEventDetails(request.params.id);

    if (!event) {
      return reply.code(404).send({ message: "Event not found" });
    }

    return event;
  });

  app.post<{ Params: EventParams }>("/events/:id/join", async (request, reply) => {
    const user = await getAuthenticatedUser(request, reply, userRepository);

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
    const user = await getAuthenticatedUser(request, reply, userRepository);

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
