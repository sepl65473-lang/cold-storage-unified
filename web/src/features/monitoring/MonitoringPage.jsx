import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PageHead } from "../../shared/components/PageHead.jsx";
import { SectionCard } from "../../shared/components/SectionCard.jsx";
import { Badge } from "../../shared/components/Badge.jsx";
import { Button } from "../../shared/components/Button.jsx";
import { StatTile } from "../../shared/components/KpiCard.jsx";
import { ChartTooltip } from "../../shared/components/ChartTooltip.jsx";
import { cn } from "../../shared/utils/cn.js";
import { MONO } from "../../shared/utils/tokens.js";
import { useRealtimeStore } from "../../stores/realtimeStore.js";
import { useChambers } from "../chambers/api.js";
import { useDevices } from "../devices/api.js";
import { RefreshCw, Thermometer, Droplets, DoorOpen } from "lucide-react";

const avg = (arr, pick) => (arr.length ? (arr.reduce((s, x) => s + Number(pick(x) || 0), 0) / arr.length) : null);

export function MonitoringPage() {
  const temp = useRealtimeStore((s) => s.temp);
  const { rows: chambers, refetch } = useChambers();
  const { rows: devices } = useDevices();
  const [auto, setAuto] = useState(true);

  // Auto-refresh: while ON, re-pull chamber data every 10s.
  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => refetch && refetch(), 10000);
    return () => clearInterval(id);
  }, [auto, refetch]);

  // Real derived stats (no hardcoded values).
  const frozen = chambers.filter((c) => c.zone === "Frozen");
  const chilled = chambers.filter((c) => c.zone === "Chilled");
  const avgFrozen = avg(frozen, (c) => c.temp);
  const avgChilled = avg(chilled, (c) => c.temp);
  const excursions = chambers.filter((c) => Math.abs(Number(c.temp) - Number(c.setpoint)) > 2).length;
  const online = devices.filter((d) => d.status === "Online").length;
  const fmtC = (v) => (v === null ? "-" : `${v > 0 ? "+" : ""}${v.toFixed(1)}C`);

  return (
    <div className="space-y-4">
      <PageHead title="Live Monitoring" sub="Real-time chamber telemetry - readings stream continuously">
        <Button icon={RefreshCw} onClick={() => setAuto((a) => !a)}>Auto-refresh: {auto ? "On" : "Off"}</Button>
      </PageHead>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Avg Frozen" value={fmtC(avgFrozen)} tone="emerald" />
        <StatTile label="Avg Chilled" value={fmtC(avgChilled)} tone="amber" />
        <StatTile label="Excursions (live)" value={String(chambers.length ? excursions : "-")} tone="red" />
        <StatTile label="Sensors Reporting" value={devices.length ? `${online}/${devices.length}` : "-"} tone="blue" />
      </div>

      <SectionCard title="Real-time Chamber Grid" subtitle="setpoint vs live reading">
        {chambers.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400">No chamber data yet - appears when the backend reports.</div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {chambers.map((c) => {
              const dev = Math.abs(c.temp - c.setpoint);
              const tone = c.status === "Critical" ? "red" : c.status === "Warning" ? "amber" : "emerald";
              const text = { red: "text-red-500", amber: "text-amber-500", emerald: "text-emerald-500" }[tone];
              return (
                <div key={c.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-700">{c.id}</span><Badge value={c.status} dot /></div>
                  <div className="mt-2 flex items-end gap-1">
                    <Thermometer className={cn("mb-1 h-4 w-4", text)} />
                    <span className="text-2xl font-semibold text-slate-900" style={{ fontFamily: MONO }}>{c.temp}</span>
                    <span className="mb-0.5 text-xs text-slate-400">/ set {c.setpoint}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1"><Droplets className="h-3 w-3" />{c.humidity}%</span>
                    <span className="flex items-center gap-1"><DoorOpen className="h-3 w-3" />{c.doors}</span>
                    <span className={cn(dev > 2 ? "text-red-500" : "text-slate-400")}>d {dev.toFixed(1)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Telemetry Stream - Frozen Zone" subtitle="C">
        {temp.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400">Waiting for live telemetry...</div>
        ) : (
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={temp} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                <XAxis dataKey="t" tick={{ fontSize: 10, fill: "#94a3b8" }} interval={4} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip unit="C" />} />
                <Line type="monotone" dataKey="frozen" stroke="#2563eb" strokeWidth={1.8} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
