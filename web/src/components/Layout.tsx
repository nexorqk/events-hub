import { Link, Outlet, useNavigate } from "react-router-dom";
import { useSessionStore } from "../stores/sessionStore";

export function Layout() {
  const navigate = useNavigate();
  const user = useSessionStore((state) => state.user);
  const signOut = useSessionStore((state) => state.signOut);

  return (
    <div className="min-h-screen bg-[#f6f2ea] text-slate-900">
      <header className="border-b border-slate-900/10 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/events" className="text-xl font-black tracking-tight text-slate-950">
            Events Hub
          </Link>
          <nav className="flex items-center gap-3 text-sm font-semibold">
            {user ? <span className="hidden text-slate-600 sm:inline">{user.name}</span> : null}
            <Link to="/events/new" className="rounded-full bg-slate-950 px-4 py-2 text-white shadow-sm">
              Create event
            </Link>
            {user ? (
              <button
                type="button"
                onClick={() => {
                  signOut();
                  navigate("/");
                }}
                className="rounded-full border border-slate-300 px-4 py-2 text-slate-700"
              >
                Sign out
              </button>
            ) : null}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
