import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore.js";

export function ProtectedRoute({ children }) {
  const authed = useAuthStore((s) => s.authed);
  if (!authed) return <Navigate to="/login" replace />;
  return children;
}
