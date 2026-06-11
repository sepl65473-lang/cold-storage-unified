// Central runtime config. Vite env vars are build-time defaults.
// URL overrides saved via Settings → Integrations take effect after reload.
const stored = (() => { try { return JSON.parse(localStorage.getItem("sepl_env") || "{}"); } catch { return {}; } })();

export const ENV = {
  API_BASE_URL: (stored.API_BASE_URL || import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, ""),
  WS_URL:       stored.WS_URL ?? (import.meta.env.VITE_WS_URL || ""),
  USE_MOCK:     (import.meta.env.VITE_USE_MOCK ?? "true") === "true",
};

export function saveEnvOverrides(overrides) {
  const current = (() => { try { return JSON.parse(localStorage.getItem("sepl_env") || "{}"); } catch { return {}; } })();
  localStorage.setItem("sepl_env", JSON.stringify({ ...current, ...overrides }));
}

export function clearEnvOverrides() {
  localStorage.removeItem("sepl_env");
}
