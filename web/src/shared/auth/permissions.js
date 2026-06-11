import { useAuthStore } from "../../stores/authStore.js";

// Frontend permission helpers.
// IMPORTANT: this only controls what the UI shows/enables (UX layer).
// It is NOT a security boundary - the backend MUST enforce permissions on
// every endpoint. A determined user can bypass client-side gating.
export function usePermissions() {
  const perms = useAuthStore((s) => s.user?.permissions || []);
  return {
    perms,
    can: (perm) => !perm || perms.includes(perm),
  };
}
