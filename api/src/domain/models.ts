export type User = {
  id: string;
  name: string;
  createdAt: string;
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

export type AuthSession = {
  user: User;
  token: string;
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

export type CreateEventInput = {
  userId: string;
  title: string;
  description: string;
  startsAt: string;
  location: string;
};

export type UpdateEventInput = CreateEventInput & {
  eventId: string;
};

export type CreateCommentInput = {
  eventId: string;
  userId: string;
  content: string;
};

export type EventFilters = {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
};
