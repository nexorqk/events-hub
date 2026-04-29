import { useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useEventsStore } from "../stores/eventsStore";
import { useSessionStore } from "../stores/sessionStore";

export function EventDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const user = useSessionStore((state) => state.user);
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

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!id) {
    return <Navigate to="/events" replace />;
  }

  const isParticipant =
    selectedEvent?.participants.some((participant) => participant.id === user.id) ?? false;

  return (
    <section>
      <Link
        to="/events"
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent-subtle hover:text-accent-hover active:bg-surface-active active:text-accent-active"
      >
        <span className="text-lg">←</span>
        Back to events
      </Link>

      {isLoading ? (
        <div className="mt-8 rounded-[2rem] bg-surface p-8 ring-1 ring-border">
          <div className="h-6 w-24 animate-pulse rounded-lg bg-border" />
          <div className="mt-4 h-12 w-3/4 animate-pulse rounded-xl bg-border" />
          <div className="mt-6 grid gap-3">
            <div className="h-4 w-full animate-pulse rounded-lg bg-border" />
            <div className="h-4 w-5/6 animate-pulse rounded-lg bg-border" />
            <div className="h-4 w-4/6 animate-pulse rounded-lg bg-border" />
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="mt-8 rounded-2xl bg-red-50 p-5 ring-1 ring-red-100">
          <p className="font-semibold text-red-700">{error}</p>
        </div>
      ) : null}

      {selectedEvent ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <article className="rounded-[2rem] bg-surface p-8 shadow-[0_24px_64px_-24px_rgba(28,25,23,0.14)] ring-1 ring-border sm:p-10">
            <span className="inline-flex items-center rounded-full bg-accent-subtle px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
              Event
            </span>
            <h1 className="mt-4 text-4xl font-black tracking-tighter text-ink sm:text-5xl" style={{ textWrap: "pretty" }}>
              {selectedEvent.title}
            </h1>
            <p className="mt-6 whitespace-pre-line text-base leading-relaxed text-muted sm:text-lg">
              {selectedEvent.description}
            </p>

            <dl className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-surface-raised p-5 ring-1 ring-border">
                <dt className="text-[11px] font-black uppercase tracking-wider text-subtle">When</dt>
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
              <div className="rounded-2xl bg-surface-raised p-5 ring-1 ring-border">
                <dt className="text-[11px] font-black uppercase tracking-wider text-subtle">Where</dt>
                <dd className="mt-2 text-sm font-bold leading-snug text-ink">
                  {selectedEvent.location}
                </dd>
              </div>
              <div className="rounded-2xl bg-surface-raised p-5 ring-1 ring-border">
                <dt className="text-[11px] font-black uppercase tracking-wider text-subtle">Host</dt>
                <dd className="mt-2 text-sm font-bold leading-snug text-ink">
                  {selectedEvent.createdBy.name}
                </dd>
              </div>
            </dl>
          </article>

          <aside className="flex flex-col rounded-[2rem] bg-ink p-6 text-white shadow-[0_24px_64px_-24px_rgba(28,25,23,0.3)] sm:p-8">
            <h2 className="text-2xl font-bold tracking-tight">Participants</h2>
            <p className="mt-1 text-sm text-white/50">
              {selectedEvent.participants.length} joined
            </p>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => {
                if (isParticipant) {
                  void leaveEvent(selectedEvent.id, user.id);
                } else {
                  void joinEvent(selectedEvent.id, user.id);
                }
              }}
              className={`mt-6 w-full rounded-2xl px-6 py-3.5 font-bold text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                isParticipant
                  ? "bg-white/10 ring-1 ring-white/15 hover:bg-white hover:text-ink active:bg-surface-active active:text-ink"
                  : "bg-accent hover:bg-accent-hover active:bg-accent-active active:shadow-[inset_0_2px_4px_rgba(12,10,9,0.24)]"
              }`}
            >
              {isParticipant ? "Leave event" : "Join event"}
            </button>

            <div className="mt-6 flex flex-col gap-2.5">
              {selectedEvent.participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/10"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold">
                    {participant.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold">{participant.name}</span>
                </div>
              ))}
              {selectedEvent.participants.length === 0 ? (
                <p className="py-4 text-center text-sm text-white/40">
                  No participants yet. Be the first to join.
                </p>
              ) : null}
            </div>
          </aside>
        </div>
      ) : null}
    </section>
  );
}
