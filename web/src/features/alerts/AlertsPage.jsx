import { PageHead } from "../../shared/components/PageHead.jsx";
import { DataTable } from "../../shared/components/DataTable.jsx";
import { Badge } from "../../shared/components/Badge.jsx";
import { Button } from "../../shared/components/Button.jsx";
import { StatTile } from "../../shared/components/KpiCard.jsx";
import { useAlerts, useAckAlert, useResolveAlert } from "./api.js";
import { Check, CheckCheck } from "lucide-react";

export function AlertsPage() {
  const { rows, total, status, refetch } = useAlerts();
  const ack = useAckAlert();
  const resolve = useResolveAlert();
  const open = rows.filter((a) => a.status === "Open");
  const ackAll = () => open.forEach((a) => ack.mutate(a.id));

  const cols = [
    { key: "id", label: "Alert ID", mono: true },
    { key: "sev", label: "Severity", render: (v) => <Badge value={v} /> },
    { key: "title", label: "Description" },
    { key: "chamber", label: "Source", mono: true },
    { key: "rule", label: "Rule", mono: true, render: (v) => <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">{v}</span> },
    { key: "owner", label: "Owner" },
    { key: "age", label: "Age", mono: true },
    { key: "status", label: "Status", render: (v) => <Badge value={v} dot /> },
    {
      key: "_actions",
      label: "Actions",
      render: (_, row) => {
        if (row.status === "Resolved") return <span className="text-xs text-slate-400">—</span>;
        return (
          <div className="flex items-center gap-1.5">
            {row.status === "Open" && (
              <button
                onClick={() => ack.mutate(row.id)}
                disabled={ack.isPending}
                className="flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-50"
              >
                <Check className="h-3 w-3" /> Ack
              </button>
            )}
            <button
              onClick={() => resolve.mutate(row.id)}
              disabled={resolve.isPending}
              className="flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
            >
              <CheckCheck className="h-3 w-3" /> Resolve
            </button>
          </div>
        );
      },
    },
  ];
  return (
    <div className="space-y-4">
      <PageHead title="Alerts" sub="Active and historical alarm events"><Button icon={Check} variant="primary" onClick={ackAll}>Acknowledge All</Button></PageHead>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Critical" value={String(rows.filter((a) => a.sev === "Critical").length)} tone="red" />
        <StatTile label="High" value={String(rows.filter((a) => a.sev === "High").length)} tone="amber" />
        <StatTile label="Open" value={String(open.length)} tone="blue" />
        <StatTile label="Resolved" value={String(rows.filter((a) => a.status === "Resolved").length)} tone="emerald" />
      </div>
      <DataTable title="Alert Log" subtitle={`${total} events`} columns={cols} rows={rows} getId={(r) => r.id} status={status} onRetry={refetch} searchKeys={["id", "title", "chamber", "owner", "rule", "status"]}
        filters={[
          { key: "sev",    label: "Severity", options: ["Critical", "High", "Medium", "Low"] },
          { key: "status", label: "Status",   options: ["Open", "Ack", "Resolved"] },
        ]}
        batchActions={[
          { label: "Bulk Ack", Icon: Check, onClick: (ids, clear) => { ids.forEach((id) => ack.mutate(id)); clear(); } },
          { label: "Bulk Resolve", Icon: CheckCheck, onClick: (ids, clear) => { ids.forEach((id) => resolve.mutate(id)); clear(); } },
        ]}
      />
    </div>
  );
}
