import { create } from "zustand";
import { apiClient } from "../api/client";
import type { CreateEventPayload, EventDetails, EventSummary, UpdateEventPayload } from "../types";

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
  joinEvent: (eventId: string, token: string) => Promise<void>;
  leaveEvent: (eventId: string, token: string) => Promise<void>;
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

  async joinEvent(eventId, token) {
    set({ isLoading: true, error: null });

    try {
      const selectedEvent = await apiClient.joinEvent(eventId, token);
      set((state) => ({
        selectedEvent,
        isLoading: false,
        events: state.events.map((e) =>
          e.id === eventId ? { ...e, participantCount: selectedEvent.participants.length } : e,
        ),
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Could not join event",
      });
    }
  },

  async leaveEvent(eventId, token) {
    set({ isLoading: true, error: null });

    try {
      const selectedEvent = await apiClient.leaveEvent(eventId, token);
      set((state) => ({
        selectedEvent,
        isLoading: false,
        events: state.events.map((e) =>
          e.id === eventId ? { ...e, participantCount: selectedEvent.participants.length } : e,
        ),
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Could not leave event",
      });
    }
  },
}));
