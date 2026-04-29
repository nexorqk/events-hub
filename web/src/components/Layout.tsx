import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useSessionStore } from "../stores/sessionStore";

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSessionStore((state) => state.user);
  const token = useSessionStore((state) => state.token);
  const signOut = useSessionStore((state) => state.signOut);
  const isSignedIn = Boolean(user && token);

  const isEvents = location.pathname === "/events";
  const isNewEvent = location.pathname === "/events/new";

  return (
    <div className="min-h-screen bg-bg text-ink">
      <header className="fixed left-1/2 top-4 z-50 w-[calc(100%-2rem)] max-w-5xl -translate-x-1/2">
        <div className="flex items-center justify-between rounded-full border border-border bg-surface/80 px-5 py-3 shadow-[0_8px_32px_-12px_rgba(28,25,23,0.15)] backdrop-blur-xl">
          <Link
            to="/events"
            className="text-lg font-bold tracking-tight text-ink transition-colors hover:text-accent active:text-accent-active"
          >
            Events Hub
          </Link>

          <nav className="flex items-center gap-2 text-sm font-semibold">
            <Link
              to="/events"
              className={`rounded-full px-4 py-2 transition-colors ${
                isEvents
                  ? "bg-ink text-bg active:text-bg shadow-[inset_0_1px_1px_rgba(255,255,255,0.14)]"
                  : "text-muted hover:bg-surface-hover hover:text-ink active:bg-surface-active active:text-ink"
              }`}
            >
              Events
            </Link>
            <Link
              to="/events/new"
              className={`rounded-full px-4 py-2 transition-colors ${
                isNewEvent
                  ? "bg-ink text-bg active:text-bg shadow-[inset_0_1px_1px_rgba(255,255,255,0.14)]"
                  : "text-muted hover:bg-surface-hover hover:text-ink active:bg-surface-active active:text-ink"
              }`}
            >
              Create
            </Link>

            <div className="mx-1 h-5 w-px bg-border" />

            {isSignedIn && user ? (
              <>
                <span className="hidden max-w-[140px] truncate text-muted sm:inline">
                  {user.name}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    signOut();
                    navigate("/");
                  }}
                  className="rounded-full border border-border bg-surface px-4 py-2 text-muted transition-colors hover:border-border-hover hover:bg-surface-hover hover:text-ink active:bg-surface-active active:text-ink"
                >
                  Sign out
                </button>
              </>
            ) : null}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-28">
        <Outlet />
      </main>
    </div>
  );
}
