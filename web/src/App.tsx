import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { EventDetailsPage } from "./pages/EventDetailsPage";
import { EventsListPage } from "./pages/EventsListPage";
import { HomePage } from "./pages/HomePage";
import { NewEventPage } from "./pages/NewEventPage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route element={<Layout />}>
        <Route path="/events" element={<EventsListPage />} />
        <Route path="/events/new" element={<NewEventPage />} />
        <Route path="/events/:id" element={<EventDetailsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
