import { lazy, Suspense } from "react";
import { AnimatePresence } from "framer-motion";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Box, Loader } from "@mantine/core";
import { Layout } from "./components/Layout";
import { PageTransition } from "./components/PageTransition";

const HomePage = lazy(() => import("./pages/HomePage").then((m) => ({ default: m.HomePage })));
const EventsListPage = lazy(() =>
  import("./pages/EventsListPage").then((m) => ({ default: m.EventsListPage })),
);
const EventDetailsPage = lazy(() =>
  import("./pages/EventDetailsPage").then((m) => ({ default: m.EventDetailsPage })),
);
const NewEventPage = lazy(() =>
  import("./pages/NewEventPage").then((m) => ({ default: m.NewEventPage })),
);

function PageLoader() {
  return (
    <Box style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
      <Loader color="accent" />
    </Box>
  );
}

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
        <Suspense fallback={<PageLoader />}>
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
        </Suspense>
      </PageTransition>
    </AnimatePresence>
  );
}
