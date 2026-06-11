export const pad = (n) => String(n).padStart(2, "0");
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const fmtTime = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
export const fmtClock = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
