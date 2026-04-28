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

  async createEvent(userId, payload) {
    set({ isLoading: true, error: null });

    try {
      const event = await apiClient.createEvent(userId, payload);
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

  async joinEvent(eventId, userId) {
    set({ isLoading: true, error: null });

    try {
      const selectedEvent = await apiClient.joinEvent(eventId, userId);
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

  async leaveEvent(eventId, userId) {
    set({ isLoading: true, error: null });

    try {
      const selectedEvent = await apiClient.leaveEvent(eventId, userId);
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
