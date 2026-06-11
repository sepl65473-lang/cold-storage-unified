import { useEffect, useState } from "react";
import { fmtClock } from "../utils/format.js";

export function useClock() {
  const [clock, setClock] = useState(fmtClock(new Date()));
  useEffect(() => {
    const t = setInterval(() => setClock(fmtClock(new Date())), 1000);
    return () => clearInterval(t);
  }, []);
  return clock;
}
