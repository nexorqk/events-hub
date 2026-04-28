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
    <section className="grid min-h-[70vh] items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
      <div>
        <p className="mb-4 text-sm font-bold uppercase tracking-[0.25em] text-orange-600">Local events</p>
        <h1 className="max-w-3xl text-5xl font-black leading-tight tracking-tight text-slate-950 sm:text-7xl">
          Find the room where things are happening.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700">
          Create small gatherings, discover what others are hosting, and join events as a demo user.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-[2rem] bg-white p-6 shadow-2xl shadow-slate-900/10">
        <h2 className="text-2xl font-black text-slate-950">Enter as demo user</h2>
        <p className="mt-2 text-sm text-slate-600">No password needed for this MVP.</p>
        <label className="mt-6 block text-sm font-bold text-slate-700" htmlFor="name">
          Your name
        </label>
        <input
          id="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none focus:border-orange-500"
          autoComplete="name"
        />
        {error ? <p className="mt-3 text-sm font-semibold text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={isLoading || !name.trim()}
          className="mt-6 w-full rounded-2xl bg-orange-600 px-5 py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Entering..." : "Continue"}
        </button>
      </form>
    </section>
  );
}
