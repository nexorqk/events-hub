export type { CreateEventInput, EventDetails, EventSummary, User } from "./models";
import type { CreateEventInput, EventDetails, EventSummary, User } from "./models";

export type DemoUserResult = {
  user: User;
  created: boolean;
};

export type EventsRepository = {
  createOrFindDemoUser(name: string): Promise<DemoUserResult>;
  listEvents(): Promise<EventSummary[]>;
  createEvent(input: CreateEventInput): Promise<EventDetails | null>;
  getEventDetails(eventId: string): Promise<EventDetails | null>;
  joinEvent(eventId: string, userId: string): Promise<EventDetails | null>;
  leaveEvent(eventId: string, userId: string): Promise<EventDetails | null>;
};
