export type User = {
  id: string;
  name: string;
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
  createdAt: string;
  updatedAt: string;
};

export type CreateEventPayload = {
  title: string;
  description: string;
  startsAt: string;
  location: string;
};
