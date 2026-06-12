import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { PageHead } from "../../shared/components/PageHead.jsx";
import { KpiCard } from "../../shared/components/KpiCard.jsx";
import { SectionCard } from "../../shared/components/SectionCard.jsx";
import { Badge } from "../../shared/components/Badge.jsx";
import { Button } from "../../shared/components/Button.jsx";
import { Legend } from "../../shared/components/Legend.jsx";
import { ChartTooltip } from "../../shared/components/ChartTooltip.jsx";
import { cn } from "../../shared/utils/cn.js";
import { MONO, DOT } from "../../shared/utils/tokens.js";
import { useRealtimeStore } from "../../stores/realtimeStore.js";
import { useDevices } from "../devices/api.js";
import { useAlerts } from "../alerts/api.js";
import { useChambers } from "../chambers/api.js";
import { useGateways } from "../gateways/api.js";
import { useWorkOrders, useDispatch } from "../logistics/api.js";
import { useFacilities } from "../../shared/hooks/useFacilities.js";
import { useUiStore } from "../../stores/uiStore.js";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../shared/services/api.js";
import { downloadSummaryCsv } from "../../shared/utils/download.js";
import { Thermometer, Droplets, Wifi, WifiOff, AlertTriangle, DoorOpen, RefreshCw, Download, Truck } from "lucide-react";

// Small inline placeholder used when a panel has no data yet (live mode before
// the backend has sent anything). Keeps the UI looking intentional, not broken.
function Empty({ label = "No data yet" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 py-8 text-center">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="text-[11px] text-slate-400">Data appears here as soon as the backend reports it.</p>
    </div>
  );
}

const num = (v) => Math.round(Number(v) || 0);
const parsePct = (v) => parseFloat(String(v ?? "").replace(/[^0-9.]/g, "")) || 0;
const avgReading = (row, keys) => {
  if (!row) return null;
  const values = keys.map((key) => Number(row[key])).filter(Number.isFinite);
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
};

export function DashboardPage() {
  const { temp, hum, feed } = useRealtimeStore();
  const statsQ = useQuery({ queryKey: ["stats"], queryFn: () => api.getStats(), refetchInterval: 10000 });
  const stats = statsQ.data || {};
  const devicesQ = useDevices();
  const alertsQ = useAlerts();
  const chambersQ = useChambers();
  const gatewaysQ = useGateways();
  const workOrdersQ = useWorkOrders();
  const dispatchQ = useDispatch();
  const { facilities } = useFacilities();
  const facility = useUiStore((s) => s.facility);

  const devices = devicesQ.rows;
  const alerts = alertsQ.rows;
  const chambers = chambersQ.rows;
  const gateways = gatewaysQ.rows;
  const workOrders = workOrdersQ.rows;
  const dispatch = dispatchQ.rows;

  // Refresh pulls every panel again.
  const refreshAll = () => {
    [devicesQ, alertsQ, chambersQ, gatewaysQ, workOrdersQ, dispatchQ].forEach((q) => q.refetch && q.refetch());
  };

  // ---- everything below is DERIVED FROM REAL DATA (no hardcoded values) ----
  const online = devices.filter((d) => d.status === "Online").length;
  const offline = devices.filter((d) => d.status === "Offline").length;
  const deviceTotal = devicesQ.total || devices.length;
  const openAlerts = stats.activeAlerts ?? alerts.filter((a) => a.status === "Open").length;
  const openDoors  = stats.doorsOpen    ?? chambers.filter((c) => c.doors === "Open").length;

  const latestTemp = temp.at(-1);
  const latestHum = hum.at(-1);
  // Use /stats for KPIs (always fresh), fall back to realtime store
  const avgTemp = stats.avgTemp ?? avgReading(latestTemp, ["frozen", "chilled", "pharma"]);
  const avgHum  = stats.avgHumidity ?? avgReading(latestHum, ["frozen", "chilled"]);

  const dash = (v) => (v === null || v === undefined ? "-" : String(v));

  const kpis = [
    { icon: Thermometer, label: "Temperature", value: avgTemp === null ? "-" : avgTemp.toFixed(1), unit: avgTemp === null ? "" : "C", tone: "emerald" },
    { icon: Droplets, label: "Humidity", value: avgHum === null ? "-" : Math.round(avgHum), unit: avgHum === null ? "" : "%", tone: "blue" },
    { icon: Wifi, label: "Online Devices", value: dash(devices.length ? online : null), unit: deviceTotal ? `/${deviceTotal}` : "", tone: "emerald" },
    { icon: WifiOff, label: "Offline Devices", value: dash(devices.length ? offline : null), unit: "", tone: "red" },
    { icon: AlertTriangle, label: "Active Alerts", value: dash(alerts.length ? openAlerts : null), unit: "", tone: "amber" },
    { icon: DoorOpen, label: "Open Doors", value: dash(chambers.length ? openDoors : null), unit: "", tone: "amber" },
  ];

  // Site health overview, derived from real facilities + their gateways.
  const sites = facilities.map((f) => {
    const gws = gateways.filter((g) => g.facility === f.id);
    const dev = gws.reduce((s, g) => s + num(g.devices), 0);
    const health = gws.length ? Math.round(gws.reduce((s, g) => s + parsePct(g.uptime), 0) / gws.length) : 0;
    return { name: f.name, health, dev, gw: gws.length };
  });

  const chamberStatus = [
    { name: "Healthy", value: chambers.filter((c) => c.status === "Healthy").length, fill: "#10b981" },
    { name: "Warning", value: chambers.filter((c) => c.status === "Warning").length, fill: "#f59e0b" },
    { name: "Critical", value: chambers.filter((c) => c.status === "Critical").length, fill: "#ef4444" },
  ];
  const hasChamberData = chamberStatus.some((c) => c.value > 0);

  const gwBars = gateways.map((g) => ({ name: g.id, uptime: parsePct(g.uptime) }));

  const escalations = alerts
    .filter((a) => (a.sev === "Critical" || a.sev === "High") && a.status !== "Resolved")
    .slice(0, 4);

  const exportShiftReport = () => {
    const stamp = new Date().toLocaleString();
    downloadSummaryCsv(`shift_report_${Date.now()}`, [
      ["Generated", stamp],
      ["Facility", facility ? facility.name : "All facilities"],
      ["Temperature", `${avgTemp === null ? "-" : avgTemp.toFixed(1)}${avgTemp === null ? "" : "C"}`],
      ["Humidity", `${avgHum === null ? "-" : Math.round(avgHum)}${avgHum === null ? "" : "%"}`],
      ["Online Devices", `${online}/${deviceTotal}`],
      ["Offline Devices", offline],
      ["Active Alerts", openAlerts],
      ["Open Doors", openDoors],
      ["Open Work Orders", workOrders.filter((w) => w.status !== "Completed").length],
      ["Dispatches", dispatch.length],
    ]);
  };

  return (
    <div className="space-y-4">
      <PageHead title="Operations Dashboard" sub={`${facility ? facility.name : "All facilities"} - live operations center`}>
        <Button icon={RefreshCw} onClick={refreshAll}>Refresh</Button>
        <Button icon={Download} variant="primary" onClick={exportShiftReport}>Shift Report</Button>
      </PageHead>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Temperature Trends" subtitle="C - live - by zone" right={<Badge value="Live" tone="emerald" dot />}>
          {temp.length === 0 ? <Empty label="Waiting for live telemetry" /> : (
            <>
              <div style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={temp} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                    <XAxis dataKey="t" tick={{ fontSize: 10, fill: "#94a3b8" }} interval={4} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip unit="C" />} />
                    <Line type="monotone" dataKey="frozen" stroke="#2563eb" strokeWidth={1.8} dot={false} isAnimationActive={false} />
                    <Line type="monotone" dataKey="chilled" stroke="#0891b2" strokeWidth={1.8} dot={false} isAnimationActive={false} />
                    <Line type="monotone" dataKey="pharma" stroke="#7c3aed" strokeWidth={1.8} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <Legend items={[["Frozen", "#2563eb"], ["Chilled", "#0891b2"], ["Pharma", "#7c3aed"]]} />
            </>
          )}
        </SectionCard>

        <SectionCard title="Humidity Trends" subtitle="%RH - live - by zone" right={<Badge value="Live" tone="emerald" dot />}>
          {hum.length === 0 ? <Empty label="Waiting for live telemetry" /> : (
            <>
              <div style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hum} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                    <defs><linearGradient id="h1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0891b2" stopOpacity={0.25} /><stop offset="100%" stopColor="#0891b2" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                    <XAxis dataKey="t" tick={{ fontSize: 10, fill: "#94a3b8" }} interval={4} axisLine={false} tickLine={false} />
                    <YAxis domain={[60, 100]} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip unit="%" />} />
                    <Area type="monotone" dataKey="frozen" stroke="#0891b2" strokeWidth={1.8} fill="url(#h1)" isAnimationActive={false} />
                    <Area type="monotone" dataKey="chilled" stroke="#2563eb" strokeWidth={1.5} fillOpacity={0} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <Legend items={[["Frozen", "#0891b2"], ["Chilled", "#2563eb"]]} />
            </>
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SectionCard title="Site Health Overview" subtitle="multi-facility">
          {sites.length === 0 ? <Empty label="No facilities reported" /> : (
            <div className="space-y-3">
              {sites.map((s) => (
                <div key={s.name}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">{s.name}</span>
                    <span className="text-slate-400" style={{ fontFamily: MONO }}>{s.health}/100</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className={cn("h-full rounded-full", s.health > 90 ? "bg-emerald-500" : s.health > 80 ? "bg-amber-500" : "bg-red-500")} style={{ width: `${s.health}%` }} />
                  </div>
                  <div className="mt-1 flex gap-3 text-[11px] text-slate-400"><span>{s.dev} devices</span><span>{s.gw} gateways</span></div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Chamber Status" subtitle={`${chambers.length} chambers`}>
          {!hasChamberData ? <Empty label="No chamber data" /> : (
            <div className="flex items-center gap-2">
              <div style={{ width: 130, height: 130 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chamberStatus} dataKey="value" innerRadius={38} outerRadius={58} paddingAngle={2} stroke="none">
                      {chamberStatus.map((c) => <Cell key={c.name} fill={c.fill} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {chamberStatus.map((c) => (
                  <div key={c.name} className="flex items-center gap-2 text-sm">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: c.fill }} />
                    <span className="text-slate-600">{c.name}</span>
                    <span className="ml-auto font-semibold text-slate-800" style={{ fontFamily: MONO }}>{c.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Gateway Health" subtitle={`uptime % - ${gateways.length} gateways`}>
          {gwBars.length === 0 ? <Empty label="No gateways reported" /> : (
            <div style={{ height: 150 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gwBars} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[50, 100]} tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip unit="%" />} />
                  <Bar dataKey="uptime" radius={[3, 3, 0, 0]}>
                    {gwBars.map((b) => <Cell key={b.name} fill={b.uptime > 95 ? "#10b981" : "#f59e0b"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Live Activity Feed" right={<Badge value="Streaming" tone="emerald" dot />} bodyClassName="p-0">
          {feed.length === 0 ? <Empty label="No activity yet" /> : (
            <ul className="max-h-72 divide-y divide-slate-50 overflow-y-auto">
              {feed.map((f) => (
                <li key={f.id} className="flex items-start gap-3 px-4 py-2.5">
                  <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", DOT[f.tone])} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-slate-700">{f.text}</p>
                    <p className="text-[11px] text-slate-400">{f.who} - {f.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Recent Alerts" right={<Badge value={`${openAlerts} open`} tone="red" />} bodyClassName="p-0">
          {alerts.length === 0 ? <Empty label="No alerts" /> : (
            <ul className="max-h-72 divide-y divide-slate-50 overflow-y-auto">
              {alerts.slice(0, 6).map((a) => (
                <li key={a.id} className="flex items-center gap-3 px-4 py-2.5">
                  <Badge value={a.sev} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-slate-700">{a.title}</p>
                    <p className="text-[11px] text-slate-400">{a.chamber} - {a.id} - {a.age}</p>
                  </div>
                  <Badge value={a.status} dot />
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SectionCard title="Work Orders" subtitle="open & in progress" bodyClassName="p-0">
          {workOrders.filter((w) => w.status !== "Completed").length === 0 ? <Empty label="No open work orders" /> : (
            <ul className="divide-y divide-slate-50">
              {workOrders.filter((w) => w.status !== "Completed").slice(0, 4).map((w) => (
                <li key={w.id} className="px-4 py-2.5">
                  <div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-700">{w.title}</span><Badge value={w.priority} /></div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400"><span>{w.id} - {w.assignee}</span><Badge value={w.sla} /></div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Dispatch Operations" subtitle="reefer fleet" bodyClassName="p-0">
          {dispatch.length === 0 ? <Empty label="No dispatches" /> : (
            <ul className="divide-y divide-slate-50">
              {dispatch.slice(0, 4).map((d) => (
                <li key={d.id} className="flex items-center gap-3 px-4 py-2.5">
                  <Truck className="h-4 w-4 text-slate-400" />
                  <div className="min-w-0 flex-1"><p className="truncate text-sm text-slate-700">{d.dest}</p><p className="text-[11px] text-slate-400">{d.vehicle} - {d.reefer} - ETA {d.eta}</p></div>
                  <Badge value={d.status} dot />
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Owner Alerts" subtitle="business-critical escalations">
          {escalations.length === 0 ? <Empty label="No critical escalations" /> : (
            <div className="space-y-2.5">
              {escalations.map((o) => (
                <div key={o.id} className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2.5">
                  <div className="flex items-start gap-2"><Badge value={o.sev} /><p className="text-sm text-slate-700">{o.title}</p></div>
                  <p className="mt-1 pl-1 text-[11px] text-slate-400">{o.chamber} - {o.id} - owner: {o.owner}</p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
