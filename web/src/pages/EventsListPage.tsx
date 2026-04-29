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
          <span className="inline-flex items-center rounded-full bg-accent-subtle px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
            Events
          </span>
          <h1 className="mt-3 text-4xl font-black tracking-tighter text-ink sm:text-5xl">
            What is coming up
          </h1>
        </div>
        <Link
          to="/events/new"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-center font-bold text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] transition-all hover:bg-accent-hover active:bg-accent-active active:shadow-[inset_0_2px_4px_rgba(12,10,9,0.24)]"
        >
          Create event
        </Link>
      </div>

      {isLoading ? (
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="rounded-[1.75rem] bg-surface p-6 ring-1 ring-border"
            >
              <div className="h-7 w-2/3 animate-pulse rounded-xl bg-border" />
              <div className="mt-3 h-4 w-full animate-pulse rounded-lg bg-border" />
              <div className="mt-2 h-4 w-4/5 animate-pulse rounded-lg bg-border" />
              <div className="mt-6 grid gap-2">
                <div className="h-4 w-1/2 animate-pulse rounded-lg bg-border" />
                <div className="h-4 w-1/3 animate-pulse rounded-lg bg-border" />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {error ? (
        <div className="mt-10 rounded-2xl bg-red-50 p-5 ring-1 ring-red-100">
          <p className="font-semibold text-red-700">{error}</p>
        </div>
      ) : null}

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {events.map((event) => (
          <Link
            key={event.id}
            to={`/events/${event.id}`}
            className="group relative rounded-[1.75rem] bg-surface p-6 ring-1 ring-border transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:shadow-[0_24px_48px_-16px_rgba(28,25,23,0.14)] hover:ring-border-hover sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-xl font-bold tracking-tight text-ink transition-colors group-hover:text-accent sm:text-2xl">
                  {event.title}
                </h2>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
                  {event.description}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-surface-raised px-3 py-1 text-xs font-bold text-muted ring-1 ring-border">
                {event.participantCount} joined
              </span>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-muted">
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                {new Date(event.startsAt).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-subtle" />
                {event.location}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-subtle" />
                Hosted by {event.createdBy.name}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {!isLoading && events.length === 0 ? (
          <div className="mt-10 flex flex-col items-center rounded-[2rem] border border-dashed border-border bg-surface p-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-raised ring-1 ring-border">
            <span className="h-2.5 w-2.5 rotate-45 rounded-[3px] bg-accent" />
          </div>
          <h2 className="mt-5 text-2xl font-bold tracking-tight text-ink">No events yet</h2>
          <p className="mt-2 max-w-sm text-muted">
            Create the first event for the community and start bringing people together.
          </p>
          <Link
            to="/events/new"
            className="mt-6 inline-flex items-center rounded-full bg-accent px-6 py-3 font-bold text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] transition-all hover:bg-accent-hover active:bg-accent-active active:shadow-[inset_0_2px_4px_rgba(12,10,9,0.24)]"
          >
            Create event
          </Link>
        </div>
      ) : null}
    </section>
  );
}
