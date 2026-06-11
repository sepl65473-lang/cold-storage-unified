import { useEffect } from "react";
import { openRealtime } from "../realtime/socket.js";
import { useRealtimeStore } from "../../stores/realtimeStore.js";

// Opens the realtime channel and routes messages into the realtime store.
export function useRealtime(enabled) {
  const pushTelemetry = useRealtimeStore((s) => s.pushTelemetry);
  const pushActivity = useRealtimeStore((s) => s.pushActivity);
  const setConnected = useRealtimeStore((s) => s.setConnected);

  useEffect(() => {
    if (!enabled) return;
    const channel = openRealtime((msg) => {
      if (msg.type === "telemetry") pushTelemetry(msg.payload);
      else if (msg.type === "activity") pushActivity(msg.payload);
    });
    setConnected(true);
    return () => { channel.close(); setConnected(false); };
  }, [enabled, pushTelemetry, pushActivity, setConnected]);
}
