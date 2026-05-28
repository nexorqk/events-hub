import type { EventDetails, EventSummary } from "../types";

export type SseEventType =
  | "event:created"
  | "event:updated"
  | "event:deleted"
  | "rsvp:changed"
  | "comment:added"
  | "comment:deleted";

export type SseListener = (eventType: SseEventType, data: EventSummary | EventDetails | { eventId: string }) => void;

export function createSseConnection(url: string, onEvent: SseListener): () => void {
  let eventSource: EventSource | null = null;
  let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  let reconnectDelay = 1000;
  const MAX_RECONNECT_DELAY = 30000;
  let disposed = false;

  const eventTypes: SseEventType[] = [
    "event:created",
    "event:updated",
    "rsvp:changed",
    "comment:added",
    "comment:deleted",
  ];

  function connect() {
    if (disposed) return;

    eventSource = new EventSource(url);

    eventSource.onopen = () => {
      reconnectDelay = 1000;
    };

    for (const eventType of eventTypes) {
      eventSource.addEventListener(eventType, ((event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          onEvent(eventType, data);
        } catch {
          // ignore parse errors
        }
      }) as EventListener);
    }

    eventSource.onerror = () => {
      if (disposed) return;
      eventSource?.close();
      eventSource = null;
      reconnectTimeout = setTimeout(() => {
        reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY);
        connect();
      }, reconnectDelay);
    };
  }

  connect();

  return () => {
    disposed = true;
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
    }
    eventSource?.close();
    eventSource = null;
  };
}
