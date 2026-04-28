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
