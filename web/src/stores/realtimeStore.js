import { create } from "zustand";
import { ENV } from "../config/env.js";
import { seedSeries, FEED_SEED } from "../shared/services/mockData.js";
import { clamp } from "../shared/utils/format.js";

// In MOCK mode we seed demo series so charts/feed are populated for a demo.
// In LIVE mode we start EMPTY and fill only from real WebSocket messages,
// so no fake data is ever shown.
const seedHum = ENV.USE_MOCK
  ? seedSeries(32, 86, 3).map((p) => ({
      ...p, frozen: clamp(p.frozen + 108, 70, 96), chilled: clamp(p.chilled + 104, 70, 96),
    }))
  : [];
const seedTemp = ENV.USE_MOCK ? seedSeries(32, -21, 1.4) : [];
const seedFeed = ENV.USE_MOCK ? FEED_SEED : [];
let feedSeq = 100;

export const useRealtimeStore = create((set) => ({
  temp: seedTemp,
  hum: seedHum,
  feed: seedFeed,
  connected: false,
  setConnected: (connected) => set({ connected }),
  // Append the newest reading and keep a rolling 32-point window. Works whether
  // the series started seeded (mock) or empty (live).
  pushTelemetry: ({ t, temp, hum }) =>
    set((s) => ({
      temp: [...s.temp, { t, ...temp }].slice(-32),
      hum: [...s.hum, { t, ...hum }].slice(-32),
    })),
  pushActivity: (entry) =>
    set((s) => ({ feed: [{ id: feedSeq++, ...entry }, ...s.feed].slice(0, 14) })),
}));
