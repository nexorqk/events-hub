export type User = {
  id: string;
  name: string;
  createdAt: string;
};

export type AuthSession = {
  user: User;
  token: string;
};

export type RsvpStatus = "going" | "maybe" | "not_going";

export type RsvpUser = {
  user: User;
  status: RsvpStatus;
  respondedAt: string;
};

export type EventComment = {
  id: string;
  eventId: string;
  user: User;
  content: string;
  createdAt: string;
};

export type EventSummary = {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  location: string;
  createdBy: User;
  participantCount: number;
};

export type EventDetails = EventSummary & {
  participants: User[];
  rsvps: RsvpUser[];
  comments: EventComment[];
  createdAt: string;
  updatedAt: string;
};

export type CreateEventPayload = {
  title: string;
  description: string;
  startsAt: string;
  location: string;
};

export type UpdateEventPayload = CreateEventPayload;
