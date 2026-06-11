import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHead } from "../../shared/components/PageHead.jsx";
import { SectionCard } from "../../shared/components/SectionCard.jsx";
import { Badge } from "../../shared/components/Badge.jsx";
import { Button } from "../../shared/components/Button.jsx";
import { Modal } from "../../shared/components/Modal.jsx";
import { Field, TextInput, SelectInput } from "../../shared/components/FormField.jsx";
import { StateBlock } from "../../shared/components/StateBlock.jsx";
import { useDevices } from "../devices/api.js";
import { useRealtimeStore } from "../../stores/realtimeStore.js";
import { useTelemetryHistory, useReports, useGenerateReport, useScheduleReport } from "./api.js";
import { downloadCsv, downloadExcel } from "../../shared/utils/download.js";
import { MONO } from "../../shared/utils/tokens.js";
import { Download, FileSpreadsheet, Plus, RefreshCw } from "lucide-react";

const reportColumns = [
  { key: "time",        label: "Time" },
  { key: "temperature", label: "Temperature (°C)" },
  { key: "humidity",    label: "Humidity (%)" },
  { key: "devices",     label: "Devices" },
];

const avg = (row, keys) => {
  if (!row) return null;
  const values = keys.map((key) => Number(row[key])).filter(Number.isFinite);
  return values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : null;
};

const buildRows = (temp, hum, deviceSummary) =>
  temp.map((tempRow, index) => {
    const humRow = hum.find((r) => r.t === tempRow.t) || hum[index];
    const temperature = avg(tempRow, ["frozen", "chilled", "pharma"]);
    const humidity    = avg(humRow,  ["frozen", "chilled"]);
    return {
      id:          `${tempRow.t}-${index}`,
      time:        tempRow.t,
      temperature: temperature === null ? "-" : temperature.toFixed(1),
      humidity:    humidity    === null ? "-" : Math.round(humidity).toString(),
      devices:     deviceSummary,
    };
  });

const schema = z.object({
  name:     z.string().min(3, "Name required"),
  type:     z.string().min(1, "Type required"),
  schedule: z.string().min(1, "Schedule required"),
});

const TYPES     = ["Compliance", "Operations", "Reliability", "Energy", "Logistics"];
const SCHEDULES = ["Daily", "Weekly - Mon", "Weekly - Fri", "Monthly - 1st", "Monthly - 15th"];

export function ReportsPage() {
  const { temp: rtTemp, hum: rtHum } = useRealtimeStore();
  const devicesQ     = useDevices();
  const devices      = devicesQ.rows;
  const onlineDevices  = devices.filter((d) => d.status === "Online").length;
  const deviceTotal    = devicesQ.total || devices.length;
  const deviceSummary  = deviceTotal ? `${onlineDevices}/${deviceTotal}` : "-";

  const weeklyQ  = useTelemetryHistory("weekly");
  const monthlyQ = useTelemetryHistory("monthly");

  const weeklyRows  = weeklyQ.temp.length  ? buildRows(weeklyQ.temp,  weeklyQ.hum,  deviceSummary) : buildRows(rtTemp, rtHum, deviceSummary);
  const monthlyRows = monthlyQ.temp.length ? buildRows(monthlyQ.temp, monthlyQ.hum, deviceSummary) : buildRows(rtTemp, rtHum, deviceSummary);
  const previewRows = weeklyRows.slice(-10);

  // Scheduled reports
  const { rows: scheduledReports, status: rptStatus, refetch: rptRefetch } = useReports();
  const generate  = useGenerateReport();
  const schedule  = useScheduleReport();

  const [schedOpen, setSchedOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { type: "Operations", schedule: "Weekly - Mon" },
  });
  const onSchedule = (data) => schedule.mutate(data, { onSuccess: () => { reset(); setSchedOpen(false); } });

  return (
    <div className="space-y-6">
      <PageHead title="Reports" sub="Temperature & humidity history — download as CSV or Excel">
        <Button icon={Download}         onClick={() => downloadCsv(`weekly_report_${Date.now()}`,   reportColumns, weeklyRows)}>Weekly CSV</Button>
        <Button icon={FileSpreadsheet}  onClick={() => downloadExcel(`weekly_report_${Date.now()}`, reportColumns, weeklyRows)}>Weekly Excel</Button>
        <Button icon={Download}         onClick={() => downloadCsv(`monthly_report_${Date.now()}`,  reportColumns, monthlyRows)}>Monthly CSV</Button>
        <Button icon={FileSpreadsheet} variant="primary" onClick={() => downloadExcel(`monthly_report_${Date.now()}`, reportColumns, monthlyRows)}>Monthly Excel</Button>
      </PageHead>

      {/* Scheduled reports */}
      <SectionCard title="Scheduled Reports"
        right={<Button icon={Plus} variant="primary" onClick={() => { reset({ type: "Operations", schedule: "Weekly - Mon" }); setSchedOpen(true); }}>New Schedule</Button>}>
        {rptStatus !== "idle" ? <StateBlock kind={rptStatus} onRetry={rptRefetch} /> : (
          <div className="overflow-hidden rounded-md border border-slate-100">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {["ID", "Report Name", "Type", "Schedule", "Last Run", "Status", ""].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-medium text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {scheduledReports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2.5 font-medium text-slate-700" style={{ fontFamily: MONO }}>{r.id}</td>
                    <td className="px-3 py-2.5 text-slate-800">{r.name}</td>
                    <td className="px-3 py-2.5"><Badge value={r.type} tone="slate" /></td>
                    <td className="px-3 py-2.5 text-slate-500" style={{ fontFamily: MONO }}>{r.schedule}</td>
                    <td className="px-3 py-2.5 text-slate-500" style={{ fontFamily: MONO }}>{r.last}</td>
                    <td className="px-3 py-2.5"><Badge value={r.status} dot /></td>
                    <td className="px-3 py-2.5">
                      <button
                        onClick={() => generate.mutate(r.id)}
                        disabled={generate.isPending || r.status === "Generating"}
                        className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                      >
                        <RefreshCw className="h-3 w-3" /> Generate now
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Live telemetry preview */}
      <SectionCard title="Recent Readings (last 10)"
        right={<span className="text-xs text-slate-400">{weeklyRows.length} total records in weekly report</span>}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-slate-50">
              <tr>
                {reportColumns.map((col) => (
                  <th key={col.key} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {previewRows.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-400">No data — waiting for telemetry</td></tr>
              ) : (
                previewRows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 text-slate-600" style={{ fontFamily: MONO }}>{row.time}</td>
                    <td className="px-4 py-2 font-medium text-blue-600"  style={{ fontFamily: MONO }}>{row.temperature}</td>
                    <td className="px-4 py-2 font-medium text-emerald-600" style={{ fontFamily: MONO }}>{row.humidity}</td>
                    <td className="px-4 py-2 text-slate-500">{row.devices}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* New schedule modal */}
      <Modal open={schedOpen} onClose={() => setSchedOpen(false)} title="Schedule New Report"
        footer={<>
          <Button onClick={() => setSchedOpen(false)}>Cancel</Button>
          <Button variant="primary" disabled={schedule.isPending} onClick={handleSubmit(onSchedule)}>
            {schedule.isPending ? "Saving…" : "Create Schedule"}
          </Button>
        </>}>
        <div className="space-y-3">
          <Field label="Report name" error={errors.name?.message}><TextInput {...register("name")} placeholder="Weekly temperature summary" /></Field>
          <Field label="Type" error={errors.type?.message}>
            <SelectInput {...register("type")}>{TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</SelectInput>
          </Field>
          <Field label="Schedule" error={errors.schedule?.message}>
            <SelectInput {...register("schedule")}>{SCHEDULES.map((s) => <option key={s} value={s}>{s}</option>)}</SelectInput>
          </Field>
        </div>
      </Modal>
    </div>
  );
}
