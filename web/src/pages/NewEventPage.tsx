import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
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
      <span className="inline-flex items-center rounded-full bg-accent-subtle px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
        Create
      </span>
      <h1 className="mt-3 text-4xl font-black tracking-tighter text-ink sm:text-5xl">
        Host a new event
      </h1>

      <form
        onSubmit={handleSubmit}
        className="mt-8 rounded-[2rem] bg-surface p-6 shadow-[0_24px_64px_-24px_rgba(28,25,23,0.14)] ring-1 ring-border sm:p-10"
      >
        <div className="grid gap-6">
          <label className="grid gap-2.5 text-sm font-semibold text-ink">
            Title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="rounded-2xl border border-border bg-surface-raised px-4 py-3.5 text-ink outline-none transition-colors placeholder:text-subtle focus:border-accent focus:ring-4 focus:ring-accent/10"
              placeholder="Give it a catchy name"
            />
          </label>

          <label className="grid gap-2.5 text-sm font-semibold text-ink">
            Description
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={5}
              className="rounded-2xl border border-border bg-surface-raised px-4 py-3.5 text-ink outline-none transition-colors placeholder:text-subtle focus:border-accent focus:ring-4 focus:ring-accent/10"
              placeholder="What is it about? Who should come?"
            />
          </label>

          <div className="grid gap-6 sm:grid-cols-2">
            <label className="grid gap-2.5 text-sm font-semibold text-ink">
              Date and time
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(event) => setStartsAt(event.target.value)}
                className="rounded-2xl border border-border bg-surface-raised px-4 py-3.5 text-ink outline-none transition-colors focus:border-accent focus:ring-4 focus:ring-accent/10"
              />
            </label>

            <label className="grid gap-2.5 text-sm font-semibold text-ink">
              Location
              <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                className="rounded-2xl border border-border bg-surface-raised px-4 py-3.5 text-ink outline-none transition-colors placeholder:text-subtle focus:border-accent focus:ring-4 focus:ring-accent/10"
                placeholder="Address or link"
              />
            </label>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl bg-red-50 p-4 ring-1 ring-red-100">
            <p className="text-sm font-semibold text-red-700">{error}</p>
          </div>
        ) : null}

        {dateError ? (
          <div className="mt-6 rounded-2xl bg-red-50 p-4 ring-1 ring-red-100">
            <p className="text-sm font-semibold text-red-700">{dateError}</p>
          </div>
        ) : null}

        <div className="mt-8 flex items-center gap-4">
          <button
            disabled={isLoading || !isFormValid}
            className="rounded-2xl bg-accent px-8 py-3.5 font-bold text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] transition-all hover:bg-accent-hover active:bg-accent-active active:shadow-[inset_0_2px_4px_rgba(12,10,9,0.24)] disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-ink disabled:shadow-none"
          >
            {isLoading ? "Creating..." : "Create event"}
          </button>
          <Link
            to="/events"
            className="rounded-2xl px-6 py-3.5 text-sm font-semibold text-muted transition-colors hover:bg-surface-hover hover:text-ink active:bg-surface-active active:text-ink"
          >
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
}
