import { AnimatePresence } from "framer-motion";
import { Link, useLocation, useNavigate, useOutlet } from "react-router-dom";
import { PageTransition } from "./PageTransition";
import { useSessionStore } from "../stores/sessionStore";

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const outlet = useOutlet();
  const user = useSessionStore((state) => state.user);
  const token = useSessionStore((state) => state.token);
  const signOut = useSessionStore((state) => state.signOut);
  const isSignedIn = Boolean(user && token);

  const isEvents = location.pathname === "/events";
  const isNewEvent = location.pathname === "/events/new";

  return (
    <div className="min-h-screen bg-bg text-ink">
      <header className="fixed left-1/2 top-4 z-50 w-[calc(100%-2rem)] max-w-5xl -translate-x-1/2">
        <div className="flex items-center justify-between rounded-xl border border-border bg-surface/90 px-4 py-3 shadow-[0_2px_12px_rgba(0,0,0,0.03)] backdrop-blur-md">
          <Link
            to="/events"
            className="font-serif text-xl font-semibold tracking-[-0.03em] text-ink transition-colors hover:text-muted active:text-muted"
          >
            Events Hub
          </Link>

          <nav className="flex items-center gap-2 text-sm font-semibold">
            <Link
              to="/events"
              className={`rounded-md px-3 py-2 transition-colors ${
                isEvents
                  ? "bg-ink text-white active:text-white"
                  : "text-muted hover:bg-surface-hover hover:text-ink active:bg-surface-active active:text-ink"
              }`}
            >
              Events
            </Link>
            <Link
              to="/events/new"
              className={`rounded-md px-3 py-2 transition-colors ${
                isNewEvent
                  ? "bg-ink text-white active:text-white"
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
                  className="rounded-md border border-border bg-surface px-3 py-2 text-muted transition-colors hover:border-border-hover hover:bg-surface-hover hover:text-ink active:bg-surface-active active:text-ink"
                >
                  Sign out
                </button>
              </>
            ) : null}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-32 pt-28">
        <AnimatePresence mode="wait" initial={false}>
          <PageTransition key={location.pathname}>{outlet}</PageTransition>
        </AnimatePresence>
      </main>
    </div>
  );
}
