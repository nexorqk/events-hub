export type {
  CreateCommentInput,
  CreateEventInput,
  EventDetails,
  EventSummary,
  RsvpStatus,
  UpdateEventInput,
  User,
} from "./models";
import type {
  CreateCommentInput,
  CreateEventInput,
  EventDetails,
  EventSummary,
  RsvpStatus,
  UpdateEventInput,
  User,
} from "./models";

export type UpdateEventResult =
  | { status: "updated"; event: EventDetails }
  | { status: "not_found" }
  | { status: "forbidden" };

export type EventsRepository = {
  listEvents(): Promise<EventSummary[]>;
  createEvent(input: CreateEventInput): Promise<EventDetails | null>;
  updateEvent(input: UpdateEventInput): Promise<UpdateEventResult>;
  getEventDetails(eventId: string): Promise<EventDetails | null>;
  setRsvp(eventId: string, userId: string, status: RsvpStatus): Promise<EventDetails | null>;
  removeRsvp(eventId: string, userId: string): Promise<EventDetails | null>;
  listComments(eventId: string): Promise<EventComment[]>;
  createComment(input: CreateCommentInput): Promise<EventComment | null>;
  deleteComment(commentId: string, userId: string): Promise<boolean>;
};

export type EventComment = {
  id: string;
  eventId: string;
  user: User;
  content: string;
  createdAt: string;
};
