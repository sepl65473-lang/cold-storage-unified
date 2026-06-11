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
import { StatTile } from "../../shared/components/KpiCard.jsx";
import { useDispatch, useCreateDispatch, useUpdateDispatch, useDeleteDispatch } from "./api.js";
import { Plus } from "lucide-react";

const schema = z.object({
  vehicle: z.string().min(3, "Vehicle no. is required"),
  reefer: z.string().min(1, "Reefer temp is required"),
  driver: z.string().min(2, "Driver is required"),
  dest: z.string().min(2, "Destination is required"),
});

export function DispatchPage() {
  const { rows, total, status, refetch } = useDispatch();
  const create = useCreateDispatch();
  const update = useUpdateDispatch();
  const remove = useDeleteDispatch();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema), defaultValues: { reefer: "-18C" },
  });
  const openCreate = () => { setEditing(null); reset({ reefer: "-18C" }); setOpen(true); };
  const openEdit = (row) => { setEditing(row); reset(row); setOpen(true); };
  const closeModal = () => { setOpen(false); setEditing(null); };
  const onSubmit = (data) => {
    const action = editing ? update : create;
    const payload = editing ? { ...editing, ...data } : data;
    action.mutate(payload, { onSuccess: () => { reset(); closeModal(); } });
  };

  const cols = [
    { key: "id", label: "Dispatch #", mono: true },
    { key: "vehicle", label: "Vehicle", mono: true },
    { key: "reefer", label: "Reefer", mono: true },
    { key: "driver", label: "Driver" },
    { key: "dest", label: "Destination" },
    { key: "load", label: "Load" },
    { key: "eta", label: "ETA", mono: true },
    { key: "status", label: "Status", render: (v) => <Badge value={v} dot /> },
  ];
  return (
    <div className="space-y-4">
      <PageHead title="Dispatch Operations" sub="Outbound reefer fleet & cold-chain handoff"><Button icon={Plus} variant="primary" onClick={openCreate}>Create Dispatch</Button></PageHead>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="In Transit" value={String(rows.filter((d) => d.status === "In Transit").length)} tone="blue" />
        <StatTile label="Loading" value={String(rows.filter((d) => d.status === "Loading").length)} tone="blue" />
        <StatTile label="Delivered" value={String(rows.filter((d) => d.status === "Delivered").length)} tone="emerald" />
        <StatTile label="Scheduled" value={String(rows.filter((d) => d.status === "Scheduled").length)} tone="slate" />
      </div>
      <DataTable title="Dispatch Board" subtitle={`${total} shipments`} columns={cols} rows={rows} getId={(r) => r.id} status={status} onRetry={refetch} searchKeys={["id", "vehicle", "driver", "dest", "status"]} pageSize={5} onEdit={openEdit} onDelete={(row) => remove.mutate(row.id)}
        filters={[
          { key: "status", label: "Status", options: ["Scheduled", "Loading", "In Transit", "Delivered"] },
          { key: "reefer", label: "Reefer",  options: ["-22C", "-18C", "+2C", "+4C", "+5C"] },
        ]}
        batchActions={[
          { label: "Delete selected", onClick: (ids, clear) => { if (window.confirm(`Delete ${ids.length} dispatches?`)) { ids.forEach((id) => remove.mutate(id)); clear(); } } },
        ]}
      />

      <Modal open={open} onClose={closeModal} title={editing ? "Edit Dispatch" : "Create Dispatch"}
        footer={<>
          <Button onClick={closeModal}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)}>{create.isPending || update.isPending ? "Saving..." : editing ? "Save Changes" : "Create"}</Button>
        </>}>
        <div className="space-y-3">
          <Field label="Vehicle number" error={errors.vehicle?.message}><TextInput register={register} name="vehicle" error={errors.vehicle} placeholder="OD-02-AK-4412" /></Field>
          <Field label="Reefer temperature" error={errors.reefer?.message}>
            <SelectInput register={register} name="reefer" error={errors.reefer} options={["-22C", "-18C", "+2C", "+4C", "+5C"].map((v) => ({ value: v, label: v }))} />
          </Field>
          <Field label="Driver" error={errors.driver?.message}><TextInput register={register} name="driver" error={errors.driver} placeholder="B. Sahoo" /></Field>
          <Field label="Destination" error={errors.dest?.message}><TextInput register={register} name="dest" error={errors.dest} placeholder="Reliance DC, Cuttack" /></Field>
        </div>
      </Modal>
    </div>
  );
}
