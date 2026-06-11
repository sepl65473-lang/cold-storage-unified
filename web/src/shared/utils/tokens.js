// Design tokens & shared maps (kept static so Tailwind never purges them).
export const MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

export const AUTH = {
  email: import.meta.env.VITE_MOCK_EMAIL || "",
  password: import.meta.env.VITE_MOCK_PASSWORD || "",
};

export const STATUS_TONE = {
  Healthy: "emerald", Online: "emerald", "On track": "emerald", Active: "emerald",
  "In Stock": "emerald", Met: "emerald", Delivered: "emerald", Completed: "emerald",
  Resolved: "slate", Closed: "slate",
  Scheduled: "blue", "In Transit": "blue", Loading: "blue", "In Progress": "blue",
  Ack: "blue", Invited: "blue", Medium: "blue",
  Warning: "amber", Degraded: "amber", "At risk": "amber", "Action Needed": "amber", High: "amber",
  Open: "red", Critical: "red", Offline: "red", Breached: "red", Suspended: "red", Urgent: "red",
  Low: "slate",
};

export const TONE = {
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  amber: "bg-amber-50 text-amber-700 ring-amber-600/20",
  red: "bg-red-50 text-red-700 ring-red-600/20",
  blue: "bg-blue-50 text-blue-700 ring-blue-600/20",
  slate: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

export const DOT = {
  emerald: "bg-emerald-500", amber: "bg-amber-500", red: "bg-red-500",
  blue: "bg-blue-500", slate: "bg-slate-400",
};

export const TEXT_TONE = {
  emerald: "text-emerald-600", amber: "text-amber-600", red: "text-red-600",
  blue: "text-blue-600", slate: "text-slate-600",
};
