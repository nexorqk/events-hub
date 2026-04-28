import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useEventsStore } from "../stores/eventsStore";
import { useSessionStore } from "../stores/sessionStore";

export function NewEventPage() {
  const navigate = useNavigate();
  const user = useSessionStore((state) => state.user);
  const createEvent = useEventsStore((state) => state.createEvent);
  const isLoading = useEventsStore((state) => state.isLoading);
  const error = useEventsStore((state) => state.error);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [location, setLocation] = useState("");
  const [dateError, setDateError] = useState<string | null>(null);

  const isFormValid = title.trim() && description.trim() && startsAt && location.trim();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user || !isFormValid) {
      return;
    }

    let isoDate: string;
    try {
      isoDate = new Date(startsAt).toISOString();
    } catch {
      setDateError("Invalid date and time");
      return;
    }

    setDateError(null);

    const createdEvent = await createEvent(user.id, {
      title,
      description,
      startsAt: isoDate,
      location,
    });

    if (createdEvent) {
      navigate(`/events/${createdEvent.id}`);
    }
  }

  return (
    <section className="mx-auto max-w-3xl">
      <p className="text-sm font-bold uppercase tracking-[0.25em] text-orange-600">Create</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">Host a new event</h1>
      <form onSubmit={handleSubmit} className="mt-8 rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-900/10">
        <div className="grid gap-5">
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Title
            <input value={title} onChange={(event) => setTitle(event.target.value)} className="rounded-2xl border border-slate-300 px-4 py-3" />
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Description
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={5} className="rounded-2xl border border-slate-300 px-4 py-3" />
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Date and time
            <input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} className="rounded-2xl border border-slate-300 px-4 py-3" />
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Location
            <input value={location} onChange={(event) => setLocation(event.target.value)} className="rounded-2xl border border-slate-300 px-4 py-3" />
          </label>
        </div>
        {error ? <p className="mt-4 rounded-2xl bg-red-50 p-3 font-semibold text-red-700">{error}</p> : null}
        {dateError ? <p className="mt-4 rounded-2xl bg-red-50 p-3 font-semibold text-red-700">{dateError}</p> : null}
        <button disabled={isLoading || !isFormValid} className="mt-6 rounded-2xl bg-slate-950 px-6 py-3 font-black text-white disabled:opacity-50">
          {isLoading ? "Creating..." : "Create event"}
        </button>
      </form>
    </section>
  );
}
