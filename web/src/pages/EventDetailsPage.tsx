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

  const isParticipant = selectedEvent?.participants.some((participant) => participant.id === user.id) ?? false;

  return (
    <section>
      <Link to="/events" className="text-sm font-bold text-orange-700">
        Back to events
      </Link>

      {isLoading ? <p className="mt-8 text-slate-600">Loading event...</p> : null}
      {error ? <p className="mt-8 rounded-2xl bg-red-50 p-4 font-semibold text-red-700">{error}</p> : null}

      {selectedEvent ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <article className="rounded-[2rem] bg-white p-8 shadow-xl shadow-slate-900/10">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-orange-600">Event</p>
            <h1 className="mt-2 text-5xl font-black tracking-tight text-slate-950">{selectedEvent.title}</h1>
            <p className="mt-6 whitespace-pre-line text-lg leading-8 text-slate-700">{selectedEvent.description}</p>
            <dl className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-100 p-4">
                <dt className="text-xs font-black uppercase tracking-wider text-slate-500">When</dt>
                <dd className="mt-1 font-bold">{new Date(selectedEvent.startsAt).toLocaleString()}</dd>
              </div>
              <div className="rounded-2xl bg-slate-100 p-4">
                <dt className="text-xs font-black uppercase tracking-wider text-slate-500">Where</dt>
                <dd className="mt-1 font-bold">{selectedEvent.location}</dd>
              </div>
              <div className="rounded-2xl bg-slate-100 p-4">
                <dt className="text-xs font-black uppercase tracking-wider text-slate-500">Host</dt>
                <dd className="mt-1 font-bold">{selectedEvent.createdBy.name}</dd>
              </div>
            </dl>
          </article>

          <aside className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl shadow-slate-900/20">
            <h2 className="text-2xl font-black">Participants</h2>
            <p className="mt-1 text-sm text-slate-300">{selectedEvent.participants.length} joined</p>
            <button
              type="button"
              onClick={() => {
                if (isParticipant) {
                  void leaveEvent(selectedEvent.id, user.id);
                } else {
                  void joinEvent(selectedEvent.id, user.id);
                }
              }}
              className="mt-6 w-full rounded-2xl bg-orange-500 px-5 py-3 font-black text-white"
            >
              {isParticipant ? "Leave event" : "Join event"}
            </button>
            <div className="mt-6 grid gap-3">
              {selectedEvent.participants.map((participant) => (
                <div key={participant.id} className="rounded-2xl bg-white/10 px-4 py-3 font-bold">
                  {participant.name}
                </div>
              ))}
              {selectedEvent.participants.length === 0 ? <p className="text-sm text-slate-300">No participants yet.</p> : null}
            </div>
          </aside>
        </div>
      ) : null}
    </section>
  );
}
