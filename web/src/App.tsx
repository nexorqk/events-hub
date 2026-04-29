import { AnimatePresence } from "framer-motion";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Layout } from "./components/Layout";
import { PageTransition } from "./components/PageTransition";
import { EventDetailsPage } from "./pages/EventDetailsPage";
import { EventsListPage } from "./pages/EventsListPage";
import { HomePage } from "./pages/HomePage";
import { NewEventPage } from "./pages/NewEventPage";

function getRouteGroup(pathname: string) {
  if (pathname === "/") {
    return "home";
  }

  if (pathname.startsWith("/events")) {
    return "events";
  }

  return "fallback";
}

export function App() {
  const location = useLocation();
  const routeGroup = getRouteGroup(location.pathname);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <PageTransition key={routeGroup}>
        <Routes location={location}>
          <Route path="/" element={<HomePage />} />
          <Route element={<Layout />}>
            <Route path="/events" element={<EventsListPage />} />
            <Route path="/events/new" element={<NewEventPage mode="create" />} />
            <Route path="/events/:id" element={<EventDetailsPage />} />
            <Route path="/events/:id/edit" element={<NewEventPage mode="edit" />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </PageTransition>
    </AnimatePresence>
  );
}
