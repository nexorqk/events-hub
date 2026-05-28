import type {
  AuthSession,
  CreateEventPayload,
  EventComment,
  EventDetails,
  EventSummary,
  RsvpStatus,
  UpdateEventPayload,
  User,
} from "../types";

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
  loginWithGoogle(credential: string) {
    return request<AuthSession>("/auth/google", {
      method: "POST",
      body: JSON.stringify({ credential }),
    });
  },

  loginDemo(name: string) {
    return request<AuthSession>("/auth/demo", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  },

  getCurrentUser(token: string) {
    return request<User>("/auth/me", { token });
  },

  listEvents(filters?: { search?: string; dateFrom?: string; dateTo?: string }) {
    const params = new URLSearchParams();
    if (filters?.search) params.set("search", filters.search);
    if (filters?.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters?.dateTo) params.set("dateTo", filters.dateTo);
    const qs = params.toString();
    return request<EventSummary[]>(`/events${qs ? `?${qs}` : ""}`);
  },

  createEvent(token: string, payload: CreateEventPayload) {
    return request<EventDetails>("/events", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    });
  },

  updateEvent(eventId: string, token: string, payload: UpdateEventPayload) {
    return request<EventDetails>(`/events/${eventId}`, {
      method: "PATCH",
      token,
      body: JSON.stringify(payload),
    });
  },

  deleteEvent(eventId: string, token: string) {
    return request<void>(`/events/${eventId}`, {
      method: "DELETE",
      token,
    });
  },

  getEventDetails(eventId: string) {
    return request<EventDetails>(`/events/${eventId}`);
  },

  setRsvp(eventId: string, token: string, status: RsvpStatus) {
    return request<EventDetails>(`/events/${eventId}/rsvp`, {
      method: "POST",
      token,
      body: JSON.stringify({ status }),
    });
  },

  removeRsvp(eventId: string, token: string) {
    return request<EventDetails>(`/events/${eventId}/rsvp`, {
      method: "DELETE",
      token,
    });
  },

  listComments(eventId: string) {
    return request<EventComment[]>(`/events/${eventId}/comments`);
  },

  createComment(eventId: string, token: string, content: string) {
    return request<EventComment>(`/events/${eventId}/comments`, {
      method: "POST",
      token,
      body: JSON.stringify({ content }),
    });
  },

  deleteComment(eventId: string, commentId: string, token: string) {
    return request<void>(`/events/${eventId}/comments/${commentId}`, {
      method: "DELETE",
      token,
    });
  },
};
