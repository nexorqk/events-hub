import { useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Reveal } from "../components/Reveal";
import { useEventsStore } from "../stores/eventsStore";
import { useSessionStore } from "../stores/sessionStore";

export function EventDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const user = useSessionStore((state) => state.user);
  const token = useSessionStore((state) => state.token);
  const selectedEvent = useEventsStore((state) => state.selectedEvent);
  const isLoading = useEventsStore((state) => state.isLoading);
  const error = useEventsStore((state) => state.error);
  const loadEvent = useEventsStore((state) => state.loadEvent);
  const joinEvent = useEventsStore((state) => state.joinEvent);
  const leaveEvent = useEventsStore((state) => state.leaveEvent);

  useEffect(() => {
    if (id) {
      void loadEvent(id);
    }
  }, [id, loadEvent]);

  if (!user || !token) {
    return <Navigate to="/" replace />;
  }

  if (!id) {
    return <Navigate to="/events" replace />;
  }

  const isParticipant =
    selectedEvent?.participants.some((participant) => participant.id === user.id) ?? false;
  const isHost = selectedEvent?.createdBy.id === user.id;

  return (
    <section>
      <Link
        to="/events"
        className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold text-muted transition-colors hover:bg-surface-hover hover:text-ink active:bg-surface-active active:text-ink"
      >
        Back to events
      </Link>

      {isLoading ? (
        <div className="mt-8 rounded-xl border border-border bg-surface p-8">
          <div className="h-6 w-24 animate-pulse rounded-lg bg-border" />
          <div className="mt-4 h-12 w-3/4 animate-pulse rounded-lg bg-border" />
          <div className="mt-6 grid gap-3">
            <div className="h-4 w-full animate-pulse rounded-lg bg-border" />
            <div className="h-4 w-5/6 animate-pulse rounded-lg bg-border" />
            <div className="h-4 w-4/6 animate-pulse rounded-lg bg-border" />
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="mt-8 rounded-xl border border-pastel-red bg-pastel-red p-5">
          <p className="font-semibold text-pastel-red-ink">{error}</p>
        </div>
      ) : null}

      {selectedEvent ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <Reveal as="article" className="rounded-xl border border-border bg-surface p-8 sm:p-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center rounded-full bg-pastel-blue px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-pastel-blue-ink">
                Event
              </span>
              {isHost ? (
                <Link
                  to={`/events/${selectedEvent.id}/edit`}
                  className="rounded-md border border-border bg-surface-raised px-4 py-2 text-sm font-semibold text-muted transition-colors hover:border-border-hover hover:bg-surface-hover hover:text-ink active:bg-surface-active active:text-ink"
                >
                  Edit event
                </Link>
              ) : null}
            </div>
            <h1 className="mt-4 font-serif text-5xl font-semibold leading-[1.05] tracking-[-0.04em] text-ink sm:text-6xl" style={{ textWrap: "pretty" }}>
              {selectedEvent.title}
            </h1>
            <p className="mt-6 whitespace-pre-line text-base leading-relaxed text-muted sm:text-lg">
              {selectedEvent.description}
            </p>

            <dl className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-surface-raised p-5">
                <dt className="font-mono text-[11px] font-bold uppercase tracking-wider text-subtle">When</dt>
                <dd className="mt-2 text-sm font-bold leading-snug text-ink">
                  {new Date(selectedEvent.startsAt).toLocaleString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </dd>
              </div>
              <div className="rounded-xl border border-border bg-surface-raised p-5">
                <dt className="font-mono text-[11px] font-bold uppercase tracking-wider text-subtle">Where</dt>
                <dd className="mt-2 text-sm font-bold leading-snug text-ink">
                  {selectedEvent.location}
                </dd>
              </div>
              <div className="rounded-xl border border-border bg-surface-raised p-5">
                <dt className="font-mono text-[11px] font-bold uppercase tracking-wider text-subtle">Host</dt>
                <dd className="mt-2 text-sm font-bold leading-snug text-ink">
                  {selectedEvent.createdBy.name}
                </dd>
              </div>
            </dl>
          </Reveal>

          <Reveal as="aside" index={1} className="flex flex-col rounded-xl border border-border bg-surface p-6 sm:p-8">
            <h2 className="text-2xl font-bold tracking-tight text-ink">Participants</h2>
            <p className="mt-1 text-sm text-muted">
              {selectedEvent.participants.length} joined
            </p>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => {
                if (isParticipant) {
                  void leaveEvent(selectedEvent.id, token);
                } else {
                  void joinEvent(selectedEvent.id, token);
                }
              }}
              className={`mt-6 w-full rounded-md px-6 py-3.5 font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                isParticipant
                  ? "border border-border bg-surface-raised text-muted hover:bg-surface-hover hover:text-ink active:bg-surface-active"
                  : "bg-accent text-ink hover:bg-accent-hover active:bg-accent-active"
              }`}
            >
              {isParticipant ? "Leave event" : "Join event"}
            </button>

            <div className="mt-6 flex flex-col gap-2.5">
              {selectedEvent.participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-surface-raised px-4 py-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-pastel-green font-mono text-xs font-bold text-pastel-green-ink">
                    {participant.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-ink">{participant.name}</span>
                </div>
              ))}
              {selectedEvent.participants.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted">
                  No participants yet. Be the first to join.
                </p>
              ) : null}
            </div>
          </Reveal>
        </div>
      ) : null}
    </section>
  );
}
