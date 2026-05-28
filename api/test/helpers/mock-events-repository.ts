import { mock } from "node:test";
import type {
  CreateCommentInput,
  CreateEventInput,
  DeleteEventResult,
  EventComment,
  EventDetails,
  EventFilters,
  EventSummary,
  EventsRepository,
  RsvpStatus,
  UpdateEventInput,
  UpdateEventResult,
} from "../../src/domain/eventsRepository";

export const fakeUser = {
  id: "11111111-1111-1111-1111-111111111111",
  name: "Test User",
  createdAt: "2026-01-01T00:00:00.000Z",
};

export const fakeEventSummary: EventSummary = {
  id: "22222222-2222-2222-2222-222222222222",
  title: "Test Event",
  description: "A test event description",
  startsAt: "2026-06-01T18:00:00.000Z",
  location: "Test Location",
  createdBy: fakeUser,
  participantCount: 0,
};

export const fakeComment: EventComment = {
  id: "33333333-3333-3333-3333-333333333333",
  eventId: fakeEventSummary.id,
  user: fakeUser,
  content: "Test comment",
  createdAt: "2026-01-01T12:00:00.000Z",
};

export const fakeEventDetails: EventDetails = {
  ...fakeEventSummary,
  participants: [],
  rsvps: [],
  comments: [fakeComment],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

export function createMockEventsRepository(
  overrides: Partial<EventsRepository> = {},
): EventsRepository {
  return {
    listEvents: mock.fn((_filters?: EventFilters) => Promise.resolve([fakeEventSummary])),
    createEvent: mock.fn((_input: CreateEventInput) => Promise.resolve(fakeEventDetails)),
    updateEvent: mock.fn((_input: UpdateEventInput): Promise<UpdateEventResult> =>
      Promise.resolve({ status: "updated", event: fakeEventDetails }),
    ),
    deleteEvent: mock.fn((_eventId: string, _userId: string): Promise<DeleteEventResult> =>
      Promise.resolve("deleted"),
    ),
    getEventDetails: mock.fn((_eventId: string) => Promise.resolve(fakeEventDetails)),
    setRsvp: mock.fn((_eventId: string, _userId: string, _status: RsvpStatus) =>
      Promise.resolve(fakeEventDetails),
    ),
    removeRsvp: mock.fn((_eventId: string, _userId: string) => Promise.resolve(fakeEventDetails)),
    listComments: mock.fn((_eventId: string) => Promise.resolve([fakeComment])),
    createComment: mock.fn((_input: CreateCommentInput) => Promise.resolve(fakeComment)),
    deleteComment: mock.fn((_commentId: string, _userId: string) => Promise.resolve(true)),
    ...overrides,
  };
}
