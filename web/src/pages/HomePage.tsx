import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Reveal } from "../components/Reveal";
import { useSessionStore } from "../stores/sessionStore";

export function HomePage() {
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const signIn = useSessionStore((state) => state.signIn);
  const signUp = useSessionStore((state) => state.signUp);
  const isLoading = useSessionStore((state) => state.isLoading);
  const error = useSessionStore((state) => state.error);
  const isFormValid = name.trim() && password.length >= 8;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isFormValid) {
      return;
    }

    if (authMode === "login") {
      await signIn(name, password);
    } else {
      await signUp(name, password);
    }

    if (useSessionStore.getState().token) {
      navigate("/events");
    }
  }

  return (
    <section className="mx-auto grid min-h-[80dvh] max-w-5xl items-center gap-14 py-24 md:py-32 lg:grid-cols-[1.08fr_0.92fr]">
      <Reveal>
        <span className="inline-flex items-center rounded-full bg-pastel-green px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-pastel-green-ink">
          Local events
        </span>
        <h1 className="mt-6 max-w-4xl font-serif text-6xl font-semibold leading-[1.04] tracking-[-0.045em] text-ink sm:text-7xl lg:text-8xl" style={{ textWrap: "pretty" }}>
          Find the room where things are happening.
        </h1>
        <p className="mt-8 max-w-lg text-lg leading-[1.65] text-muted" style={{ textWrap: "pretty" }}>
          Create small gatherings, discover what others are hosting, and join events with a saved account.
        </p>
      </Reveal>

      <Reveal
        as="section"
        index={1}
        className="rounded-xl border border-border bg-surface p-8 lg:p-10"
      >
      <form
        onSubmit={handleSubmit}
      >
        <h2 className="text-2xl font-bold tracking-tight text-ink">
          {authMode === "login" ? "Sign in" : "Create account"}
        </h2>
        <p className="mt-2 text-sm text-muted">
          Use your name and password to keep ownership of your events.
        </p>

        <div className="mt-6 grid grid-cols-2 rounded-lg border border-border bg-surface-raised p-1">
          <button
            type="button"
            onClick={() => setAuthMode("login")}
            className={`rounded-md px-4 py-2 text-sm font-bold transition-colors ${
              authMode === "login" ? "bg-ink text-white" : "text-muted hover:text-ink"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setAuthMode("register")}
            className={`rounded-md px-4 py-2 text-sm font-bold transition-colors ${
              authMode === "register" ? "bg-ink text-white" : "text-muted hover:text-ink"
            }`}
          >
            Register
          </button>
        </div>

        <label className="mt-8 block text-sm font-semibold text-ink" htmlFor="name">
          Your name
        </label>
        <input
          id="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-2 w-full rounded-lg border border-border bg-surface-raised px-4 py-3.5 text-ink outline-none transition-colors placeholder:text-subtle focus:border-ink focus:ring-2 focus:ring-ink/10"
          placeholder="e.g. Mira Patel"
          autoComplete="name"
        />

        <label className="mt-5 block text-sm font-semibold text-ink" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 w-full rounded-lg border border-border bg-surface-raised px-4 py-3.5 text-ink outline-none transition-colors placeholder:text-subtle focus:border-ink focus:ring-2 focus:ring-ink/10"
          placeholder="At least 8 characters"
          autoComplete={authMode === "login" ? "current-password" : "new-password"}
        />

        <p
          className={`mt-4 min-h-10 text-sm font-semibold transition-opacity ${
            error ? "text-pastel-red-ink opacity-100" : "text-transparent opacity-0"
          }`}
          role="status"
          aria-live="polite"
        >
          {error ?? " "}
        </p>

        <button
          type="submit"
          disabled={isLoading || !isFormValid}
          className="mt-2 w-full rounded-md bg-ink px-6 py-3.5 font-bold text-white transition-colors hover:bg-accent-hover active:bg-accent-active disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-ink"
        >
          {isLoading ? "Please wait..." : authMode === "login" ? "Sign in" : "Create account"}
        </button>
      </form>
      </Reveal>
    </section>
  );
}
