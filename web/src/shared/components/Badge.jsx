import { cn } from "../utils/cn.js";
import { STATUS_TONE, TONE, DOT } from "../utils/tokens.js";

export function Badge({ value, tone, dot }) {
  const t = tone || STATUS_TONE[value] || "slate";
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap", TONE[t])}>
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", DOT[t])} />}
      {value}
    </span>
  );
}
