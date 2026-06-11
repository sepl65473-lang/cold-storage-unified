import { usePermissions } from "../auth/permissions.js";

// Renders children only if the current user has the permission.
export function Can({ perm, children, fallback = null }) {
  const { can } = usePermissions();
  return can(perm) ? children : fallback;
}
