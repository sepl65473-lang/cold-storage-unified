import { ENV } from "../../config/env.js";
import { getToken } from "../auth/session.js";
import { pad, clamp } from "../utils/format.js";

// Opens a realtime channel.
// - MOCK mode    → simulates telemetry locally (no backend needed)
// - WS_URL set   → connects a real WebSocket with auto-reconnect
// - No WS_URL    → polls /sensors API every 10s as fallback (works without WebSocket)
export function openRealtime(onMessage) {
  if (ENV.USE_MOCK)  return mockChannel(onMessage);
  if (!ENV.WS_URL)   return pollChannel(onMessage);

  let ws, closed = false, retry;
  const connect = () => {
    ws = new WebSocket(`${ENV.WS_URL}?token=${getToken() || ""}`);
    ws.onmessage = (e) => { try { onMessage(JSON.parse(e.data)); } catch { /* ignore */ } };
    ws.onclose   = () => { if (!closed) retry = setTimeout(connect, 3000); };
    ws.onerror   = () => ws.close();
  };
  connect();
  return { close() { closed = true; clearTimeout(retry); ws && ws.close(); } };
}

// Polling fallback — used when VITE_WS_URL is not set.
// Seeds the chart with history on start, then polls /sensors/:id/latest every 10s.
function pollChannel(onMessage) {
  let active = true;
  let timer;

  const toTime = (ts) => {
    const d = new Date(ts || Date.now());
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const apiFetch = (path) =>
    fetch(`${ENV.API_BASE_URL}${path}`, {
      headers: { Authorization: `Bearer ${getToken() || ""}` },
    }).then((r) => r.json()).catch(() => null);

  // Step 1 — seed chart with historical readings from backend dashboard endpoints
  const seedHistory = async () => {
    if (!active) return;
    try {
      const [tempRes, humRes] = await Promise.all([
        apiFetch("/history/temperature"),
        apiFetch("/history/humidity"),
      ]);
      const tempArr = Array.isArray(tempRes) ? tempRes : [];
      const humArr  = Array.isArray(humRes)  ? humRes  : [];
      const len = Math.max(tempArr.length, humArr.length);
      for (let i = 0; i < len; i++) {
        const tRow = tempArr[i];
        const hRow = humArr[i];
        // Backend returns { time, temp } and { time, val }
        const t = tRow?.temp ?? null;
        onMessage({
          type: "telemetry",
          payload: {
            t:    tRow?.time || hRow?.time || "--:--",
            temp: { frozen: t, chilled: t, pharma: t },
            hum:  { frozen: hRow?.val ?? null, chilled: hRow?.val ?? null },
          },
        });
      }
    } catch { /* ignore seed errors */ }
  };

  // Step 2 — poll /chambers every 10s for live device readings
  const pollLatest = async () => {
    if (!active) return;
    try {
      const token = getToken();
      if (!token) { timer = setTimeout(pollLatest, 10000); return; }

      // /chambers returns [{ id, name, temp, humidity, status, doorStatus }]
      const chambers = await apiFetch("/chambers");
      const arr = Array.isArray(chambers) ? chambers : [];

      if (arr.length) {
        // Map first 3 chambers to frozen / chilled / pharma zones
        const [c0, c1, c2] = arr;
        const t = toTime(Date.now());

        onMessage({
          type: "telemetry",
          payload: {
            t,
            temp: {
              frozen:  c0?.temp ?? null,
              chilled: c1?.temp ?? c0?.temp ?? null,
              pharma:  c2?.temp ?? c0?.temp ?? null,
            },
            hum: {
              frozen:  c0?.humidity ?? null,
              chilled: c1?.humidity ?? c0?.humidity ?? null,
            },
          },
        });

        const now = new Date();
        const online = arr.filter((c) => c.status === "online").length;
        onMessage({
          type: "activity",
          payload: {
            tone: "blue",
            text: `Live readings synced — ${online} of ${arr.length} chamber${arr.length > 1 ? "s" : ""} online`,
            who:  "Polling",
            time: `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`,
          },
        });
      }
    } catch { /* ignore poll errors */ }

    if (active) timer = setTimeout(pollLatest, 10000); // poll every 10s
  };

  // Start: seed history first, then begin polling
  seedHistory().then(() => { if (active) pollLatest(); });

  return { close() { active = false; clearTimeout(timer); } };
}

// Mock mode: simulate telemetry + activity locally (no backend)
function mockChannel(onMessage) {
  let temp = { frozen: -21, chilled: 3, pharma: 5 };
  let hum  = { frozen: 88, chilled: 84 };
  const pool = [
    { tone: "blue",    text: "Telemetry batch ingested - 46 readings",     who: "Gateway Mesh" },
    { tone: "emerald", text: "CH-01 within band - setpoint stable",         who: "Monitoring" },
    { tone: "amber",   text: "Humidity drift advisory - CH-07",             who: "System" },
    { tone: "slate",   text: "Heartbeat OK - GW-02, GW-03, GW-05",         who: "Gateways" },
  ];
  const id = setInterval(() => {
    const now = new Date();
    const t   = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    temp = {
      frozen:  +clamp(temp.frozen  + (Math.random() - 0.5) * 0.6, -24, -17).toFixed(2),
      chilled: +clamp(temp.chilled + (Math.random() - 0.5) * 0.7,   1,   7).toFixed(2),
      pharma:  +clamp(temp.pharma  + (Math.random() - 0.5) * 0.5,   3,   7).toFixed(2),
    };
    hum = {
      frozen:  +clamp(hum.frozen  + (Math.random() - 0.5) * 1.2, 72, 95).toFixed(1),
      chilled: +clamp(hum.chilled + (Math.random() - 0.5) * 1.2, 72, 95).toFixed(1),
    };
    onMessage({ type: "telemetry", payload: { t, temp, hum } });
    if (Math.random() < 0.45) {
      const p = pool[Math.floor(Math.random() * pool.length)];
      onMessage({ type: "activity", payload: { ...p, time: `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}` } });
    }
  }, 3000);
  return { close() { clearInterval(id); } };
}
