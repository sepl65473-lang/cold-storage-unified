import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHead } from "../../shared/components/PageHead.jsx";
import { DataTable } from "../../shared/components/DataTable.jsx";
import { Badge } from "../../shared/components/Badge.jsx";
import { Button } from "../../shared/components/Button.jsx";
import { StatTile } from "../../shared/components/KpiCard.jsx";
import { Modal } from "../../shared/components/Modal.jsx";
import { Field, TextInput, SelectInput } from "../../shared/components/FormField.jsx";
import { cn } from "../../shared/utils/cn.js";
import { MONO } from "../../shared/utils/tokens.js";
import { useDevices, usePagedDevices, useCreateDevice, useUpdateDevice, useDeleteDevice } from "./api.js";
import { Plus, Signal } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  type: z.string().min(1, "Type is required"),
  chamber: z.string().min(1, "Chamber is required"),
});

export function DevicesPage() {
  // All devices — used only for stat tiles (counts across all pages)
  const { rows: allRows }  = useDevices();
  // Server-paged devices — drives the DataTable
  const { rows, total, page, setPage, search, setSearch, status, refetch, isFetching } = usePagedDevices(9);
  const create = useCreateDevice();
  const update = useUpdateDevice();
  const remove = useDeleteDevice();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema), defaultValues: { type: "Temp Sensor" },
  });
  const openCreate = () => { setEditing(null); reset({ type: "Temp Sensor" }); setOpen(true); };
  const openEdit = (row) => { setEditing(row); reset(row); setOpen(true); };
  const closeModal = () => { setOpen(false); setEditing(null); };
  const onSubmit = (data) => {
    const action = editing ? update : create;
    const payload = editing ? { ...editing, ...data } : data;
    action.mutate(payload, { onSuccess: () => { reset(); closeModal(); } });
  };

  const online  = allRows.filter((d) => d.status === "Online").length;
  const offline = allRows.filter((d) => d.status === "Offline").length;
  const degraded = allRows.filter((d) => d.status === "Degraded").length;

  const cols = [
    { key: "id", label: "Device ID", mono: true },
    { key: "name", label: "Name" },
    { key: "type", label: "Type", render: (v) => <Badge value={v} tone="slate" /> },
    { key: "chamber", label: "Chamber", mono: true },
    { key: "gateway", label: "Gateway", mono: true },
    { key: "battery", label: "Battery", render: (v) => (
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-12 overflow-hidden rounded-full bg-slate-100"><div className={cn("h-full", v < 20 ? "bg-red-500" : v < 50 ? "bg-amber-500" : "bg-emerald-500")} style={{ width: `${v}%` }} /></div>
        <span className="text-xs text-slate-500" style={{ fontFamily: MONO }}>{v}%</span>
      </div>
    )},
    { key: "rssi", label: "Signal", mono: true, render: (v) => (
      <span className="inline-flex items-center gap-1"><Signal className={cn("h-3.5 w-3.5", v > -70 ? "text-emerald-500" : v > -90 ? "text-amber-500" : "text-red-400")} />{v} dBm</span>
    )},
    { key: "firmware", label: "Firmware", mono: true },
    { key: "lastSeen", label: "Last Seen" },
    { key: "status", label: "Status", render: (v) => <Badge value={v} dot /> },
  ];

  return (
    <div className="space-y-4">
      <PageHead title="Devices" sub="IoT sensor & equipment fleet">
        <Button icon={Plus} variant="primary" onClick={openCreate}>Register Device</Button>
      </PageHead>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Total" value={String(total)} tone="blue" />
        <StatTile label="Online" value={String(online)} tone="emerald" />
        <StatTile label="Degraded" value={String(degraded)} tone="amber" />
        <StatTile label="Offline" value={String(offline)} tone="red" />
      </div>

      <DataTable title="Device Registry" subtitle={`${total} devices`} columns={cols} rows={rows} getId={(r) => r.id}
        status={status} onRetry={refetch} pageSize={9} onEdit={openEdit} onDelete={(row) => remove.mutate(row.id)}
        serverMode total={total} page={page} onPageChange={setPage} search={search} onSearch={setSearch}
        filters={[
          { key: "type",   label: "Type",   options: ["Temp Sensor", "Humidity Sensor", "Door Sensor", "Compressor", "Power Meter"] },
          { key: "status", label: "Status", options: ["Online", "Degraded", "Offline"] },
        ]}
        batchActions={[
          { label: "Delete selected", onClick: (ids, clear) => { if (window.confirm(`Delete ${ids.length} devices?`)) { ids.forEach((id) => remove.mutate(id)); clear(); } } },
        ]}
      />

      <Modal open={open} onClose={closeModal} title={editing ? "Edit Device" : "Register Device"}
        footer={<>
          <Button onClick={closeModal}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)}>{create.isPending || update.isPending ? "Saving..." : editing ? "Save Changes" : "Register"}</Button>
        </>}>
        <div className="space-y-3">
          <Field label="Device name" error={errors.name?.message}><TextInput register={register} name="name" error={errors.name} placeholder="Temp Sensor 47" /></Field>
          <Field label="Type" error={errors.type?.message}>
            <SelectInput register={register} name="type" error={errors.type} options={["Temp Sensor", "Humidity Sensor", "Door Sensor", "Compressor", "Power Meter"].map((t) => ({ value: t, label: t }))} />
          </Field>
          <Field label="Chamber" error={errors.chamber?.message}><TextInput register={register} name="chamber" error={errors.chamber} placeholder="CH-01" /></Field>
        </div>
      </Modal>
    </div>
  );
}
