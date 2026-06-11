import { Navigate } from "react-router-dom";
import { usePermissions } from "../../shared/auth/permissions.js";

// Route-level permission gate. NOTE: UX only - backend must also enforce.
export function RequirePerm({ perm, children }) {
  const { can } = usePermissions();
  if (!can(perm)) return <Navigate to="/dashboard" replace />;
  return children;
}
