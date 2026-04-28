import { Navigate, Route, Routes } from "react-router-dom";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<div>Events Hub</div>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
