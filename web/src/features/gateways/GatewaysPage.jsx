import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHead } from "../../shared/components/PageHead.jsx";
import { DataTable } from "../../shared/components/DataTable.jsx";
import { Badge } from "../../shared/components/Badge.jsx";
import { Button } from "../../shared/components/Button.jsx";
import { Modal } from "../../shared/components/Modal.jsx";
import { Field, TextInput, SelectInput } from "../../shared/components/FormField.jsx";
import { cn } from "../../shared/utils/cn.js";
import { useGateways, useCreateGateway, useUpdateGateway, useDeleteGateway } from "./api.js";
import { Plus, RefreshCw } from "lucide-react";

const FACILITIES = ["SEPL-NORTH", "SEPL-WEST", "SEPL-DELTA"];

const schema = z.object({
  name:        z.string().min(2, "Name required"),
  facility_id: z.string().min(1, "Facility required"),
  ip:          z.string().min(7, "IP address required"),
  fw:          z.string().min(1, "Firmware version required"),
});

export function GatewaysPage() {
  const { rows, total, status, refetch } = useGateways();
  const create = useCreateGateway();
  const update = useUpdateGateway();
  const remove = useDeleteGateway();
  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { facility_id: "SEPL-NORTH", fw: "gw-2.0.4" },
  });

  const openCreate = () => { setEditing(null); reset({ facility_id: "SEPL-NORTH", fw: "gw-2.0.4" }); setOpen(true); };
  const openEdit   = (row) => { setEditing(row); reset({ name: row.name, facility_id: row.facility_id || row.facility, ip: row.ip, fw: row.fw }); setOpen(true); };
  const closeModal = () => { setOpen(false); setEditing(null); };

  const onSubmit = (data) => {
    const action = editing ? update : create;
    const payload = editing ? { ...editing, ...data } : data;
    action.mutate(payload, { onSuccess: closeModal });
  };

  const cols = [
    { key: "id",       label: "Gateway",  mono: true },
    { key: "name",     label: "Name" },
    { key: "facility", label: "Facility", mono: true },
    { key: "devices",  label: "Devices",  mono: true },
    { key: "uptime",   label: "Uptime",   mono: true, render: (v) => (
      <span className={cn(parseFloat(v) < 95 && "font-semibold text-amber-600")}>{v}</span>
    )},
    { key: "ip",       label: "IP",       mono: true },
    { key: "fw",       label: "Firmware", mono: true },
    { key: "lastSync", label: "Last Sync" },
    { key: "status",   label: "Status",   render: (v) => <Badge value={v} dot /> },
  ];

  return (
    <div className="space-y-4">
      <PageHead title="Gateways" sub="Edge gateway connectivity & sync health">
        <Button icon={RefreshCw} onClick={() => refetch()}>Ping All</Button>
        <Button icon={Plus} variant="primary" onClick={openCreate}>Add Gateway</Button>
      </PageHead>

      <DataTable
        title="Gateway Fleet" subtitle={`${total} gateways`}
        columns={cols} rows={rows} getId={(r) => r.id}
        status={status} onRetry={refetch}
        searchKeys={["id", "name", "facility", "status", "ip"]}
        pageSize={5}
        onEdit={openEdit}
        onDelete={(row) => remove.mutate(row.id)}
        filters={[{ key: "status", label: "Status", options: ["Online", "Degraded", "Offline"] }]}
      />

      <Modal open={open} onClose={closeModal} title={editing ? "Edit Gateway" : "Add Gateway"}
        footer={<>
          <Button onClick={closeModal}>Cancel</Button>
          <Button variant="primary" disabled={create.isPending || update.isPending} onClick={handleSubmit(onSubmit)}>
            {create.isPending || update.isPending ? "Saving…" : editing ? "Save Changes" : "Add"}
          </Button>
        </>}>
        <div className="space-y-3">
          <Field label="Name" error={errors.name?.message}><TextInput {...register("name")} placeholder="Gateway Alpha" /></Field>
          <Field label="Facility" error={errors.facility_id?.message}>
            <SelectInput {...register("facility_id")}>
              {FACILITIES.map((f) => <option key={f} value={f}>{f}</option>)}
            </SelectInput>
          </Field>
          <Field label="IP Address" error={errors.ip?.message}><TextInput {...register("ip")} placeholder="10.40.1.10" /></Field>
          <Field label="Firmware" error={errors.fw?.message}><TextInput {...register("fw")} placeholder="gw-2.0.4" /></Field>
        </div>
      </Modal>
    </div>
  );
}
