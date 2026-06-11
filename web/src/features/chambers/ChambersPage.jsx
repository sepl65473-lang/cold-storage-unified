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
import { MONO } from "../../shared/utils/tokens.js";
import { useChambers, useCreateChamber, useUpdateChamber, useDeleteChamber } from "./api.js";
import { Plus } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  zone: z.string().min(1, "Zone is required"),
  setpoint: z.coerce.number({ invalid_type_error: "Number required" }),
});

export function ChambersPage() {
  const { rows, total, status, refetch } = useChambers();
  const create = useCreateChamber();
  const update = useUpdateChamber();
  const remove = useDeleteChamber();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema), defaultValues: { zone: "Frozen", setpoint: -20 },
  });
  const openCreate = () => { setEditing(null); reset({ zone: "Frozen", setpoint: -20 }); setOpen(true); };
  const openEdit = (row) => { setEditing(row); reset(row); setOpen(true); };
  const closeModal = () => { setOpen(false); setEditing(null); };
  const onSubmit = (data) => {
    const action = editing ? update : create;
    const payload = editing ? { ...editing, ...data } : data;
    action.mutate(payload, { onSuccess: () => { reset(); closeModal(); } });
  };

  const cols = [
    { key: "id", label: "ID", mono: true },
    { key: "name", label: "Chamber" },
    { key: "zone", label: "Zone", render: (v) => <Badge value={v} tone="slate" /> },
    { key: "setpoint", label: "Setpoint", mono: true, render: (v) => `${v}C` },
    { key: "temp", label: "Live Temp", mono: true, render: (v, r) => <span className={cn(Math.abs(v - r.setpoint) > 2 && "font-semibold text-red-600")}>{v}C</span> },
    { key: "humidity", label: "RH", mono: true, render: (v) => `${v}%` },
    { key: "capacity", label: "Utilization", render: (v) => (
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100"><div className={cn("h-full", v > 85 ? "bg-amber-500" : "bg-blue-500")} style={{ width: `${v}%` }} /></div>
        <span className="text-xs text-slate-500" style={{ fontFamily: MONO }}>{v}%</span>
      </div>
    )},
    { key: "doors", label: "Doors", render: (v) => <Badge value={v} tone={v === "Open" ? "amber" : "slate"} dot /> },
    { key: "status", label: "Status", render: (v) => <Badge value={v} dot /> },
  ];

  return (
    <div className="space-y-4">
      <PageHead title="Chambers" sub="Storage chamber configuration & live status">
        <Button icon={Plus} variant="primary" onClick={openCreate}>Add Chamber</Button>
      </PageHead>
      <DataTable title="All Chambers" subtitle={`${total} chambers`} columns={cols} rows={rows} getId={(r) => r.id} status={status} onRetry={refetch} searchKeys={["id", "name", "zone", "status"]} onEdit={openEdit} onDelete={(row) => remove.mutate(row.id)} />

      <Modal open={open} onClose={closeModal} title={editing ? "Edit Chamber" : "Add Chamber"}
        footer={<>
          <Button onClick={closeModal}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)}>{create.isPending || update.isPending ? "Saving..." : editing ? "Save Changes" : "Create"}</Button>
        </>}>
        <div className="space-y-3">
          <Field label="Chamber name" error={errors.name?.message}><TextInput register={register} name="name" error={errors.name} placeholder="Chamber E1 - Frozen" /></Field>
          <Field label="Zone" error={errors.zone?.message}>
            <SelectInput register={register} name="zone" error={errors.zone} options={["Frozen", "Chilled", "Dairy", "Pharma", "Buffer"].map((z) => ({ value: z, label: z }))} />
          </Field>
          <Field label="Setpoint (C)" error={errors.setpoint?.message}><TextInput register={register} name="setpoint" error={errors.setpoint} type="number" /></Field>
        </div>
      </Modal>
    </div>
  );
}
