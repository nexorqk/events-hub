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
  const { userId, ...rest } = options;
  const headers = new Headers(rest.headers);

  if (rest.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (userId) {
    headers.set("X-User-Id", userId);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...rest, headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network error";
    throw new ApiError(message, 0);
  }

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
