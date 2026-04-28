import { useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { useEventsStore } from "../stores/eventsStore";
import { useSessionStore } from "../stores/sessionStore";

export function EventsListPage() {
  const user = useSessionStore((state) => state.user);
  const events = useEventsStore((state) => state.events);
  const isLoading = useEventsStore((state) => state.isLoading);
  const error = useEventsStore((state) => state.error);
  const loadEvents = useEventsStore((state) => state.loadEvents);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <section>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-orange-600">Events</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">What is coming up</h1>
        </div>
        <Link to="/events/new" className="rounded-full bg-orange-600 px-5 py-3 text-center font-black text-white">
          Create event
        </Link>
      </div>

      {isLoading ? <p className="mt-8 text-slate-600">Loading events...</p> : null}
      {error ? <p className="mt-8 rounded-2xl bg-red-50 p-4 font-semibold text-red-700">{error}</p> : null}

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {events.map((event) => (
          <Link
            key={event.id}
            to={`/events/${event.id}`}
            className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-950">{event.title}</h2>
                <p className="mt-2 line-clamp-2 text-slate-600">{event.description}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">
                {event.participantCount} joined
              </span>
            </div>
            <div className="mt-6 grid gap-2 text-sm font-semibold text-slate-600">
              <span>{new Date(event.startsAt).toLocaleString()}</span>
              <span>{event.location}</span>
              <span>Hosted by {event.createdBy.name}</span>
            </div>
          </Link>
        ))}
      </div>

      {!isLoading && events.length === 0 ? (
        <div className="mt-8 rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center">
          <h2 className="text-2xl font-black text-slate-950">No events yet</h2>
          <p className="mt-2 text-slate-600">Create the first event for the community.</p>
        </div>
      ) : null}
    </section>
  );
}
