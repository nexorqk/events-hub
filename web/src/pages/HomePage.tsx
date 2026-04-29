import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSessionStore } from "../stores/sessionStore";

export function HomePage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const signIn = useSessionStore((state) => state.signIn);
  const isLoading = useSessionStore((state) => state.isLoading);
  const error = useSessionStore((state) => state.error);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      return;
    }

    await signIn(name);

    if (useSessionStore.getState().user) {
      navigate("/events");
    }
  }

  return (
    <section className="mx-auto grid min-h-[80dvh] max-w-6xl items-center gap-12 px-4 py-16 lg:grid-cols-[1.1fr_0.9fr]">
      <div>
        <span className="inline-flex items-center rounded-full bg-accent-subtle px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
          Local events
        </span>
        <h1 className="mt-6 max-w-3xl text-6xl font-black leading-[0.95] tracking-tighter text-ink sm:text-7xl lg:text-8xl" style={{ textWrap: "pretty" }}>
          Find the room where things are happening.
        </h1>
        <p className="mt-8 max-w-lg text-lg leading-relaxed text-muted" style={{ textWrap: "pretty" }}>
          Create small gatherings, discover what others are hosting, and join events as a demo user.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-[2rem] bg-surface p-8 shadow-[0_24px_64px_-24px_rgba(28,25,23,0.18)] ring-1 ring-border lg:p-10"
      >
        <h2 className="text-2xl font-bold tracking-tight text-ink">Enter as demo user</h2>
        <p className="mt-2 text-sm text-muted">No password needed for this MVP.</p>

        <label className="mt-8 block text-sm font-semibold text-ink" htmlFor="name">
          Your name
        </label>
        <input
          id="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-border bg-surface-raised px-4 py-3.5 text-ink outline-none transition-colors placeholder:text-subtle focus:border-accent focus:ring-4 focus:ring-accent/10"
          placeholder="e.g. Alex"
          autoComplete="name"
        />

        {error ? (
          <p className="mt-4 text-sm font-semibold text-red-600">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={isLoading || !name.trim()}
          className="mt-6 w-full rounded-2xl bg-accent px-6 py-3.5 font-bold text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] transition-all hover:bg-accent-hover active:bg-accent-active active:shadow-[inset_0_2px_4px_rgba(12,10,9,0.24)] disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-ink disabled:shadow-none"
        >
          {isLoading ? "Entering..." : "Continue"}
        </button>
      </form>
    </section>
  );
}
