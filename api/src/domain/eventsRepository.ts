export type { CreateEventInput, EventDetails, EventSummary, UpdateEventInput, User } from "./models";
import type { CreateEventInput, EventDetails, EventSummary, UpdateEventInput, User } from "./models";

export type UpdateEventResult =
  | { status: "updated"; event: EventDetails }
  | { status: "not_found" }
  | { status: "forbidden" };

export type EventsRepository = {
  listEvents(): Promise<EventSummary[]>;
  createEvent(input: CreateEventInput): Promise<EventDetails | null>;
  updateEvent(input: UpdateEventInput): Promise<UpdateEventResult>;
  getEventDetails(eventId: string): Promise<EventDetails | null>;
  joinEvent(eventId: string, userId: string): Promise<EventDetails | null>;
  leaveEvent(eventId: string, userId: string): Promise<EventDetails | null>;
};
