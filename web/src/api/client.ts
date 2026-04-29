import type { AuthSession, CreateEventPayload, EventDetails, EventSummary, User } from "../types";

const API_BASE = "/api";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit & { token?: string } = {}): Promise<T> {
  const { token, ...rest } = options;
  const headers = new Headers(rest.headers);

  if (rest.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
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
  register(name: string, password: string) {
    return request<AuthSession>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, password }),
    });
  },

  login(name: string, password: string) {
    return request<AuthSession>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ name, password }),
    });
  },

  getCurrentUser(token: string) {
    return request<User>("/auth/me", { token });
  },

  listEvents() {
    return request<EventSummary[]>("/events");
  },

  createEvent(token: string, payload: CreateEventPayload) {
    return request<EventDetails>("/events", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    });
  },

  getEventDetails(eventId: string) {
    return request<EventDetails>(`/events/${eventId}`);
  },

  joinEvent(eventId: string, token: string) {
    return request<EventDetails>(`/events/${eventId}/join`, {
      method: "POST",
      token,
    });
  },

  leaveEvent(eventId: string, token: string) {
    return request<EventDetails>(`/events/${eventId}/join`, {
      method: "DELETE",
      token,
    });
  },
};
