import { create } from "zustand";
import { apiClient } from "../api/client";
import type { CreateEventPayload, EventDetails, EventSummary, RsvpStatus, UpdateEventPayload } from "../types";

type EventsState = {
  events: EventSummary[];
  selectedEvent: EventDetails | null;
  isLoading: boolean;
  error: string | null;
  loadEvents: () => Promise<void>;
  loadEvent: (eventId: string) => Promise<void>;
  createEvent: (token: string, payload: CreateEventPayload) => Promise<EventDetails | null>;
  updateEvent: (
    eventId: string,
    token: string,
    payload: UpdateEventPayload,
  ) => Promise<EventDetails | null>;
  setRsvp: (eventId: string, token: string, status: RsvpStatus) => Promise<void>;
  removeRsvp: (eventId: string, token: string) => Promise<void>;
  loadComments: (eventId: string) => Promise<void>;
  createComment: (eventId: string, token: string, content: string) => Promise<void>;
  deleteComment: (eventId: string, commentId: string, token: string) => Promise<void>;
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

  async setRsvp(eventId, token, status) {
    set({ isLoading: true, error: null });

    try {
      const selectedEvent = await apiClient.setRsvp(eventId, token, status);
      set((state) => ({
        selectedEvent,
        isLoading: false,
        events: state.events.map((e) =>
          e.id === eventId
            ? { ...e, participantCount: selectedEvent.participants.length }
            : e,
        ),
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Could not update RSVP",
      });
    }
  },

  async removeRsvp(eventId, token) {
    set({ isLoading: true, error: null });

    try {
      const selectedEvent = await apiClient.removeRsvp(eventId, token);
      set((state) => ({
        selectedEvent,
        isLoading: false,
        events: state.events.map((e) =>
          e.id === eventId
            ? { ...e, participantCount: selectedEvent.participants.length }
            : e,
        ),
      }));
    } catch (error) {
      set({
        isLoading: false,
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
}));
