import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHead } from "../../shared/components/PageHead.jsx";
import { SectionCard } from "../../shared/components/SectionCard.jsx";
import { StateBlock } from "../../shared/components/StateBlock.jsx";
import { Badge } from "../../shared/components/Badge.jsx";
import { Button } from "../../shared/components/Button.jsx";
import { Modal } from "../../shared/components/Modal.jsx";
import { Field, TextInput, SelectInput } from "../../shared/components/FormField.jsx";
import { useRoles, useCreateRole, useUpdateRole, useDeleteRole } from "./api.js";
import { Plus, ShieldCheck, Check } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Role name is required"),
  scope: z.string().min(1, "Scope is required"),
  desc: z.string().optional(),
});

export function RolesPage() {
  const { roles, perms, matrix, status } = useRoles();
  const create = useCreateRole();
  const update = useUpdateRole();
  const remove = useDeleteRole();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema), defaultValues: { scope: "Facility" },
  });
  const openCreate = () => { setEditing(null); reset({ scope: "Facility" }); setOpen(true); };
  const openEdit = (row) => { setEditing(row); reset(row); setOpen(true); };
  const closeModal = () => { setOpen(false); setEditing(null); };
  const onSubmit = (data) => {
    const action = editing ? update : create;
    const payload = editing ? { ...editing, ...data } : data;
    action.mutate(payload, { onSuccess: () => { reset(); closeModal(); } });
  };
  const deleteRole = (row) => {
    if (window.confirm(`Delete ${row.name}?`)) remove.mutate(row.id);
  };

  return (
    <div className="space-y-4">
      <PageHead title="Roles & Permissions" sub="Role-based access control"><Button icon={Plus} variant="primary" onClick={openCreate}>New Role</Button></PageHead>
      {status !== "idle" ? <StateBlock kind={status} /> : (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {roles.map((r) => (
              <div key={r.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-blue-600" /><span className="font-semibold text-slate-800">{r.name}</span></div>
                  <Badge value={r.scope} tone="slate" />
                </div>
                <p className="mt-1.5 text-xs text-slate-500">{r.desc}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                  <span>{r.users} {r.users === 1 ? "user" : "users"}</span>
                  <span className="flex items-center gap-3">
                    <button onClick={() => openEdit(r)} className="font-medium text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => deleteRole(r)} className="font-medium text-red-600 hover:underline">Delete</button>
                  </span>
                </div>
              </div>
            ))}
          </div>
          <SectionCard title="Permission Matrix" subtitle="module access by role">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left">
                    <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Role</th>
                    {perms.map((p) => <th key={p} className="px-2 py-2 text-center text-[10px] font-medium text-slate-500">{p}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(matrix).map(([role, list]) => (
                    <tr key={role} className="border-b border-slate-50">
                      <td className="px-3 py-2.5 font-medium text-slate-700">{role}</td>
                      {perms.map((p) => (
                        <td key={p} className="px-2 py-2.5 text-center">
                          {list.includes(p) ? <Check className="mx-auto h-4 w-4 text-emerald-500" /> : <span className="text-slate-200">-</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </>
      )}

      <Modal open={open} onClose={closeModal} title={editing ? "Edit Role" : "New Role"}
        footer={<>
          <Button onClick={closeModal}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)}>{create.isPending || update.isPending ? "Saving..." : editing ? "Save Changes" : "Create Role"}</Button>
        </>}>
        <div className="space-y-3">
          <Field label="Role name" error={errors.name?.message}><TextInput register={register} name="name" error={errors.name} placeholder="Shift Supervisor" /></Field>
          <Field label="Scope" error={errors.scope?.message}>
            <SelectInput register={register} name="scope" error={errors.scope} options={["Global", "Facility"].map((s) => ({ value: s, label: s }))} />
          </Field>
          <Field label="Description" error={errors.desc?.message}><TextInput register={register} name="desc" error={errors.desc} placeholder="What this role can do" /></Field>
        </div>
      </Modal>
    </div>
  );
}
