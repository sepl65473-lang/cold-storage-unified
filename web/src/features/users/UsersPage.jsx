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
import { useUsers, useInviteUser, useUpdateUser, useDeleteUser } from "./api.js";
import { Plus } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  role: z.string().min(1, "Role is required"),
});

export function UsersPage() {
  const { rows, total, status, refetch } = useUsers();
  const invite = useInviteUser();
  const update = useUpdateUser();
  const remove = useDeleteUser();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema), defaultValues: { role: "Operator" } });
  const openCreate = () => { setEditing(null); reset({ role: "Operator" }); setOpen(true); };
  const openEdit = (row) => { setEditing(row); reset(row); setOpen(true); };
  const closeModal = () => { setOpen(false); setEditing(null); };
  const onSubmit = (data) => {
    const action = editing ? update : invite;
    const payload = editing ? { ...editing, ...data } : data;
    action.mutate(payload, { onSuccess: () => { reset(); closeModal(); } });
  };

  const cols = [
    { key: "id", label: "ID", mono: true },
    { key: "name", label: "Name", render: (v) => (
      <div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-full bg-slate-200 text-[10px] font-semibold text-slate-600">{String(v).split(" ").map((x) => x[0]).slice(0, 2).join("")}</span>{v}</div>
    )},
    { key: "email", label: "Email", mono: true },
    { key: "role", label: "Role", render: (v) => <Badge value={v} tone="blue" /> },
    { key: "facility", label: "Facility", mono: true },
    { key: "last", label: "Last Active" },
    { key: "status", label: "Status", render: (v) => <Badge value={v} dot /> },
  ];
  return (
    <div className="space-y-4">
      <PageHead title="Users" sub="Workspace members & access"><Button icon={Plus} variant="primary" onClick={openCreate}>Invite User</Button></PageHead>
      <DataTable title="Members" subtitle={`${total} users`} columns={cols} rows={rows} getId={(r) => r.id} status={status} onRetry={refetch} searchKeys={["name", "email", "role", "facility", "status"]} pageSize={7} onEdit={openEdit} onDelete={(row) => remove.mutate(row.id)} />

      <Modal open={open} onClose={closeModal} title={editing ? "Edit User" : "Invite User"}
        footer={<><Button onClick={closeModal}>Cancel</Button><Button variant="primary" onClick={handleSubmit(onSubmit)}>{invite.isPending || update.isPending ? "Saving..." : editing ? "Save Changes" : "Send invite"}</Button></>}>
        <div className="space-y-3">
          <Field label="Full name" error={errors.name?.message}><TextInput register={register} name="name" error={errors.name} placeholder="Ravi Kumar" /></Field>
          <Field label="Email" error={errors.email?.message}><TextInput register={register} name="email" error={errors.email} placeholder="ravi@sepl.in" /></Field>
          <Field label="Role" error={errors.role?.message}>
            <SelectInput register={register} name="role" error={errors.role} options={["Owner", "Facility Manager", "Operator", "Maintenance Lead", "Dispatch", "Warehouse Manager"].map((r) => ({ value: r, label: r }))} />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
