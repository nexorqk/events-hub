export type User = {
  id: string;
  name: string;
  createdAt: string;
};

export type AuthUser = User & {
  passwordHash: string;
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
