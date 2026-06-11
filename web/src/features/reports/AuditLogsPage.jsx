import { PageHead } from "../../shared/components/PageHead.jsx";
import { DataTable } from "../../shared/components/DataTable.jsx";
import { Button } from "../../shared/components/Button.jsx";
import { useAudit } from "./auditApi.js";
import { downloadCsv } from "../../shared/utils/download.js";
import { Download } from "lucide-react";

export function AuditLogsPage() {
  const { rows, total, status, refetch } = useAudit();
  const cols = [
    { key: "id", label: "Event", mono: true },
    { key: "ts", label: "Time", mono: true },
    { key: "actor", label: "Actor" },
    { key: "action", label: "Action" },
    { key: "target", label: "Target", mono: true },
    { key: "ip", label: "Source IP", mono: true },
  ];
  return (
    <div className="space-y-4">
      <PageHead title="Audit Logs" sub="Immutable record of system & user activity"><Button icon={Download} onClick={() => downloadCsv(`audit_trail_${Date.now()}`, cols, rows)}>Export Trail</Button></PageHead>
      <DataTable title="Audit Trail" subtitle={`${total} events`} selectable={false} columns={cols} rows={rows} getId={(r) => r.id} status={status} onRetry={refetch} searchKeys={["id", "actor", "action", "target"]} />
    </div>
  );
}
