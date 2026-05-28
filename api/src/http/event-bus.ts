import { EventEmitter } from "node:events";
import type { EventDetails, EventSummary } from "../domain/models";

export type SseEvent =
  | { type: "event:created"; data: EventSummary }
  | { type: "event:updated"; data: EventDetails }
  | { type: "event:deleted"; data: { eventId: string } }
  | { type: "rsvp:changed"; data: EventDetails }
  | { type: "comment:added"; data: EventDetails }
  | { type: "comment:deleted"; data: EventDetails };

export type EventBus = {
  emit(event: SseEvent): void;
  subscribe(listener: (event: SseEvent) => void): () => void;
};

export function createEventBus(): EventBus {
  const emitter = new EventEmitter();
  emitter.setMaxListeners(100);

  return {
    emit(event: SseEvent) {
      emitter.emit("sse", event);
    },
    subscribe(listener: (event: SseEvent) => void) {
      emitter.on("sse", listener);
      return () => {
        emitter.off("sse", listener);
      };
    },
  };
}
