import { create } from "zustand";
import { apiClient } from "../api/client";
import { createSseConnection, type SseEventType } from "../api/sse";
import type { CreateEventPayload, EventDetails, EventSummary, RsvpStatus, UpdateEventPayload } from "../types";

type EventsState = {
  events: EventSummary[];
  selectedEvent: EventDetails | null;
  isLoading: boolean;
  error: string | null;
  loadEvents: (filters?: { search?: string; dateFrom?: string; dateTo?: string }) => Promise<void>;
  loadEvent: (eventId: string) => Promise<void>;
  createEvent: (token: string, payload: CreateEventPayload) => Promise<EventDetails | null>;
  updateEvent: (
    eventId: string,
    token: string,
    payload: UpdateEventPayload,
  ) => Promise<EventDetails | null>;
  deleteEvent: (eventId: string, token: string) => Promise<boolean>;
  setRsvp: (eventId: string, token: string, status: RsvpStatus) => Promise<void>;
  removeRsvp: (eventId: string, token: string) => Promise<void>;
  loadComments: (eventId: string) => Promise<void>;
  createComment: (eventId: string, token: string, content: string) => Promise<void>;
  deleteComment: (eventId: string, commentId: string, token: string) => Promise<void>;
  subscribeToEvents: () => void;
  subscribeToEvent: (eventId: string) => void;
  unsubscribeFromEvents: () => void;
  unsubscribeFromEvent: () => void;
};

let listCleanup: (() => void) | null = null;
let detailCleanup: (() => void) | null = null;

export const useEventsStore = create<EventsState>((set, get) => ({
  events: [],
  selectedEvent: null,
  isLoading: false,
  error: null,

  async loadEvents(filters) {
    set({ isLoading: true, error: null });

    try {
      const events = await apiClient.listEvents(filters);
      set({ events, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Could not load events",
      });
    }
  },

  async loadEvent(eventId) {
    set({ isLoading: true, error: null, selectedEvent: null });

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

  async createEvent(token, payload) {
    set({ isLoading: true, error: null });

    try {
      const event = await apiClient.createEvent(token, payload);
      set((state) => ({
        selectedEvent: event,
        events: [...state.events, event],
        isLoading: false,
      }));
      return event;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Could not create event",
      });
      return null;
    }
  },

  async updateEvent(eventId, token, payload) {
    set({ isLoading: true, error: null });

    try {
      const event = await apiClient.updateEvent(eventId, token, payload);
      set((state) => ({
        selectedEvent: event,
        events: state.events.map((candidate) => (candidate.id === event.id ? event : candidate)),
        isLoading: false,
      }));
      return event;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Could not update event",
      });
      return null;
    }
  },

  async deleteEvent(eventId, token) {
    set({ error: null });

    try {
      await apiClient.deleteEvent(eventId, token);
      set((state) => ({
        events: state.events.filter((e) => e.id !== eventId),
        selectedEvent: state.selectedEvent?.id === eventId ? null : state.selectedEvent,
      }));
      return true;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Could not delete event",
      });
      return false;
    }
  },

  async setRsvp(eventId, token, status) {
    set({ error: null });

    try {
      const selectedEvent = await apiClient.setRsvp(eventId, token, status);
      set((state) => ({
        selectedEvent,
        events: state.events.map((e) =>
          e.id === eventId
            ? { ...e, participantCount: selectedEvent.participants.length }
            : e,
        ),
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Could not update RSVP",
      });
    }
  },

  async removeRsvp(eventId, token) {
    set({ error: null });

    try {
      const selectedEvent = await apiClient.removeRsvp(eventId, token);
      set((state) => ({
        selectedEvent,
        events: state.events.map((e) =>
          e.id === eventId
            ? { ...e, participantCount: selectedEvent.participants.length }
            : e,
        ),
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Could not remove RSVP",
      });
    }
  },

  async loadComments(eventId) {
    try {
      const comments = await apiClient.listComments(eventId);
      set((state) => ({
        selectedEvent: state.selectedEvent
          ? { ...state.selectedEvent, comments }
          : null,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Could not load comments",
      });
    }
  },

  async createComment(eventId, token, content) {
    try {
      const comment = await apiClient.createComment(eventId, token, content);
      set((state) => ({
        selectedEvent: state.selectedEvent
          ? { ...state.selectedEvent, comments: [...state.selectedEvent.comments, comment] }
          : null,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Could not create comment",
      });
    }
  },

  async deleteComment(eventId, commentId, token) {
    try {
      await apiClient.deleteComment(eventId, commentId, token);
      set((state) => ({
        selectedEvent: state.selectedEvent
          ? {
              ...state.selectedEvent,
              comments: state.selectedEvent.comments.filter((c) => c.id !== commentId),
            }
          : null,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Could not delete comment",
      });
    }
  },

  subscribeToEvents() {
    listCleanup?.();
    listCleanup = createSseConnection("/api/events/stream", (eventType, data) => {
      const state = get();
      if (eventType === "event:created") {
        const event = data as EventSummary;
        if (!state.events.find((e) => e.id === event.id)) {
          set({ events: [...state.events, event] });
        }
      } else if (eventType === "event:updated") {
        const event = data as EventDetails;
        set({
          events: state.events.map((e) =>
            e.id === event.id
              ? { ...e, ...event, participantCount: event.participants.length }
              : e,
          ),
        });
      } else if (eventType === "event:deleted") {
        const deletedId = (data as { eventId: string }).eventId;
        set({
          events: state.events.filter((e) => e.id !== deletedId),
          selectedEvent: state.selectedEvent?.id === deletedId ? null : state.selectedEvent,
        });
      } else if (eventType === "rsvp:changed") {
        const event = data as EventDetails;
        set({
          events: state.events.map((e) =>
            e.id === event.id ? { ...e, participantCount: event.participants.length } : e,
          ),
        });
      }
    });
  },

  subscribeToEvent(eventId) {
    detailCleanup?.();
    detailCleanup = createSseConnection(`/api/events/${eventId}/stream`, (eventType, data) => {
      const state = get();
      const event = data as EventDetails;
      if (
        eventType === "event:updated" ||
        eventType === "rsvp:changed" ||
        eventType === "comment:added" ||
        eventType === "comment:deleted"
      ) {
        if (state.selectedEvent?.id === eventId) {
          set({ selectedEvent: event });
        }
        if (eventType === "rsvp:changed") {
          set({
            events: state.events.map((e) =>
              e.id === eventId ? { ...e, participantCount: event.participants.length } : e,
            ),
          });
        }
      }
    });
  },

  unsubscribeFromEvents() {
    listCleanup?.();
    listCleanup = null;
  },

  unsubscribeFromEvent() {
    detailCleanup?.();
    detailCleanup = null;
  },
}));
