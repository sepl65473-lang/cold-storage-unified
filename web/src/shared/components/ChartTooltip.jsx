import { MONO } from "../utils/tokens.js";

export function ChartTooltip({ active, payload, label, unit = "" }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <div className="mb-1 font-medium text-slate-500">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="capitalize text-slate-600">{p.dataKey}</span>
          <span className="ml-auto font-semibold text-slate-800" style={{ fontFamily: MONO }}>
            {p.value}{unit}
          </span>
        </div>
      ))}
    </div>
  );
}
