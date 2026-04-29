import { useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { Reveal } from "../components/Reveal";
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
      <Reveal className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <span className="inline-flex items-center rounded-full bg-pastel-blue px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-pastel-blue-ink">
            Events
          </span>
          <h1 className="mt-3 font-serif text-5xl font-semibold leading-[1.05] tracking-[-0.04em] text-ink sm:text-6xl">
            What is coming up
          </h1>
        </div>
        <Link
          to="/events/new"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-accent px-5 py-3 text-center font-bold text-ink transition-colors hover:bg-accent-hover active:bg-accent-active"
        >
          Create event
        </Link>
      </Reveal>

      {isLoading ? (
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-surface p-6"
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
        <div className="mt-10 rounded-xl border border-pastel-red bg-pastel-red p-5">
          <p className="font-semibold text-pastel-red-ink">{error}</p>
        </div>
      ) : null}

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {events.map((event, index) => (
          <Reveal key={event.id} index={index}>
            <Link
              to={`/events/${event.id}`}
              className="group relative block rounded-xl border border-border bg-surface p-6 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:border-border-hover hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] sm:p-8"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-xl font-bold tracking-tight text-ink transition-colors group-hover:text-muted sm:text-2xl">
                    {event.title}
                  </h2>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
                    {event.description}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-pastel-yellow px-3 py-1 text-xs font-bold uppercase tracking-[0.05em] text-pastel-yellow-ink">
                  {event.participantCount} joined
                </span>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs font-medium text-muted">
                <span>
                  {new Date(event.startsAt).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span>{event.location}</span>
                <span>Hosted by {event.createdBy.name}</span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>

      {!isLoading && events.length === 0 ? (
          <Reveal className="mt-10 flex flex-col items-center rounded-xl border border-dashed border-border bg-surface p-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-border bg-surface-raised">
            <span className="h-2.5 w-2.5 rotate-45 rounded-[3px] bg-ink" />
          </div>
          <h2 className="mt-5 text-2xl font-bold tracking-tight text-ink">No events yet</h2>
          <p className="mt-2 max-w-sm text-muted">
            Create the first event for the community and start bringing people together.
          </p>
          <Link
            to="/events/new"
            className="mt-6 inline-flex items-center rounded-md bg-accent px-5 py-3 font-bold text-ink transition-colors hover:bg-accent-hover active:bg-accent-active"
          >
            Create event
          </Link>
        </Reveal>
      ) : null}
    </section>
  );
}
