import { ResponsiveContainer, AreaChart, Area } from "recharts";
import { cn } from "../utils/cn.js";
import { TONE, MONO } from "../utils/tokens.js";
import { TrendingUp, TrendingDown } from "lucide-react";

export function KpiCard({ icon: Icon, label, value, unit, delta, tone = "blue", spark }) {
  const up = delta != null && delta >= 0;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3.5 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</span>
        <span className={cn("grid h-6 w-6 place-items-center rounded", TONE[tone])}>
          <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
        </span>
      </div>
      <div className="mt-1.5 flex items-end gap-1">
        <span className="text-2xl font-semibold leading-none tracking-tight text-slate-900" style={{ fontFamily: MONO }}>{value}</span>
        {unit && <span className="pb-0.5 text-xs text-slate-400">{unit}</span>}
      </div>
      {delta != null && (
        <div className={cn("mt-1.5 flex items-center gap-1 text-[11px] font-medium", up ? "text-emerald-600" : "text-red-600")}>
          {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {Math.abs(delta)}% <span className="text-slate-400">vs last hour</span>
        </div>
      )}
      {spark && (
        <div style={{ height: 28 }} className="mt-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={spark}>
              <Area type="monotone" dataKey="v" stroke="#2563eb" strokeWidth={1.5} fill="#dbeafe" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export function StatTile({ label, value, tone = "slate" }) {
  const text = { emerald: "text-emerald-600", amber: "text-amber-600", red: "text-red-600", blue: "text-blue-600", slate: "text-slate-700" }[tone];
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3.5 py-3 shadow-sm">
      <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className={cn("mt-1 text-xl font-semibold", text)} style={{ fontFamily: MONO }}>{value}</div>
    </div>
  );
}
