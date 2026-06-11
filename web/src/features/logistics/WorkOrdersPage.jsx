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
import { useWorkOrders, useCreateWorkOrder, useUpdateWorkOrder, useDeleteWorkOrder } from "./api.js";
import { Plus } from "lucide-react";

const schema = z.object({
  title: z.string().min(3, "Title is required"),
  asset: z.string().min(1, "Asset is required"),
  priority: z.string(),
});

export function WorkOrdersPage() {
  const { rows, total, status, refetch } = useWorkOrders();
  const create = useCreateWorkOrder();
  const update = useUpdateWorkOrder();
  const remove = useDeleteWorkOrder();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema), defaultValues: { priority: "Medium" } });
  const openCreate = () => { setEditing(null); reset({ priority: "Medium" }); setOpen(true); };
  const openEdit = (row) => { setEditing(row); reset(row); setOpen(true); };
  const closeModal = () => { setOpen(false); setEditing(null); };
  const onSubmit = (data) => {
    const action = editing ? update : create;
    const payload = editing ? { ...editing, ...data } : data;
    action.mutate(payload, { onSuccess: () => { reset(); closeModal(); } });
  };

  const cols = [
    { key: "id", label: "WO #", mono: true },
    { key: "title", label: "Task" },
    { key: "asset", label: "Asset", mono: true },
    { key: "priority", label: "Priority", render: (v) => <Badge value={v} /> },
    { key: "assignee", label: "Assignee" },
    { key: "due", label: "Due" },
    { key: "sla", label: "SLA", render: (v) => <Badge value={v} dot /> },
    { key: "status", label: "Status", render: (v) => <Badge value={v} dot /> },
  ];
  return (
    <div className="space-y-4">
      <PageHead title="Work Orders" sub="Maintenance & service task management"><Button icon={Plus} variant="primary" onClick={openCreate}>New Work Order</Button></PageHead>
      <DataTable title="Work Orders" subtitle={`${total} orders`} columns={cols} rows={rows} getId={(r) => r.id} status={status} onRetry={refetch} searchKeys={["id", "title", "asset", "assignee", "status", "priority"]} pageSize={6} onEdit={openEdit} onDelete={(row) => remove.mutate(row.id)}
        filters={[
          { key: "priority", label: "Priority", options: ["Urgent", "High", "Medium", "Low"] },
          { key: "status",   label: "Status",   options: ["Open", "In Progress", "Scheduled", "Completed"] },
        ]}
        batchActions={[
          { label: "Delete selected", onClick: (ids, clear) => { if (window.confirm(`Delete ${ids.length} work orders?`)) { ids.forEach((id) => remove.mutate(id)); clear(); } } },
        ]}
      />

      <Modal open={open} onClose={closeModal} title={editing ? "Edit Work Order" : "New Work Order"}
        footer={<><Button onClick={closeModal}>Cancel</Button><Button variant="primary" onClick={handleSubmit(onSubmit)}>{create.isPending || update.isPending ? "Saving..." : editing ? "Save Changes" : "Create"}</Button></>}>
        <div className="space-y-3">
          <Field label="Task" error={errors.title?.message}><TextInput register={register} name="title" error={errors.title} placeholder="Replace condenser fan motor" /></Field>
          <Field label="Asset" error={errors.asset?.message}><TextInput register={register} name="asset" error={errors.asset} placeholder="CH-04 Compressor" /></Field>
          <Field label="Priority" error={errors.priority?.message}>
            <SelectInput register={register} name="priority" error={errors.priority} options={["Urgent", "High", "Medium", "Low"].map((p) => ({ value: p, label: p }))} />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
