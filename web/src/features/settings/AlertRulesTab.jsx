import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../../shared/components/Button.jsx";
import { Modal } from "../../shared/components/Modal.jsx";
import { Badge } from "../../shared/components/Badge.jsx";
import { Field, TextInput, SelectInput } from "../../shared/components/FormField.jsx";
import { StateBlock } from "../../shared/components/StateBlock.jsx";
import { MONO } from "../../shared/utils/tokens.js";
import { useAlertRules, useCreateAlertRule, useUpdateAlertRule, useDeleteAlertRule } from "./alertRulesApi.js";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

const SEVERITIES = ["Critical", "High", "Medium", "Low"];

const schema = z.object({
  code:      z.string().min(2, "Code required").regex(/^[A-Z0-9_]+$/, "Uppercase letters, digits & underscores only"),
  name:      z.string().min(3, "Name required"),
  condition: z.string().min(3, "Condition required"),
  severity:  z.enum(["Critical", "High", "Medium", "Low"], { required_error: "Severity required" }),
});

export function AlertRulesTab() {
  const { rows, status, refetch } = useAlertRules();
  const create  = useCreateAlertRule();
  const update  = useUpdateAlertRule();
  const remove  = useDeleteAlertRule();
  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { severity: "Medium" },
  });

  const openCreate = () => { setEditing(null); reset({ severity: "Medium", code: "", name: "", condition: "" }); setOpen(true); };
  const openEdit   = (row) => { setEditing(row); reset({ code: row.code, name: row.name, condition: row.condition, severity: row.severity }); setOpen(true); };
  const closeModal = () => { setOpen(false); setEditing(null); };

  const onSubmit = (data) => {
    const payload = editing
      ? { id: editing.id, ...data, enabled: editing.enabled }
      : { ...data, enabled: true };
    const action = editing ? update : create;
    action.mutate(payload, { onSuccess: closeModal });
  };

  const toggleEnabled = (row) => update.mutate({ id: row.id, ...row, enabled: !row.enabled });
  const confirmDelete = (row) => setDeleting(row);
  const doDelete      = () => { remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) }); };

  if (status !== "idle") return <StateBlock kind={status} onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">Rules trigger alerts when the condition is met. Disable a rule to suppress its alerts.</p>
        <Button icon={Plus} variant="primary" onClick={openCreate}>Add rule</Button>
      </div>

      <div className="overflow-hidden rounded-md border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {["Code", "Name", "Condition", "Severity", "Enabled", ""].map((h) => (
                <th key={h} className="px-3 py-2 text-left text-xs font-medium text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((rule) => (
              <tr key={rule.id} className="group hover:bg-slate-50">
                <td className="px-3 py-2 font-medium text-slate-800" style={{ fontFamily: MONO }}>{rule.code}</td>
                <td className="px-3 py-2 text-slate-700">{rule.name}</td>
                <td className="px-3 py-2 text-slate-500" style={{ fontFamily: MONO }}>{rule.condition}</td>
                <td className="px-3 py-2"><Badge value={rule.severity} /></td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => toggleEnabled(rule)}
                    disabled={update.isPending}
                    className="text-slate-400 transition hover:text-blue-600 disabled:opacity-40"
                  >
                    {rule.enabled
                      ? <ToggleRight className="h-5 w-5 text-emerald-500" />
                      : <ToggleLeft className="h-5 w-5 text-slate-300" />
                    }
                  </button>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                    <button onClick={() => openEdit(rule)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => confirmDelete(rule)} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-sm text-slate-400">No rules yet. Add one to start generating alerts.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit modal */}
      <Modal open={open} onClose={closeModal} title={editing ? "Edit rule" : "New alert rule"}
        footer={<><Button onClick={closeModal}>Cancel</Button><Button variant="primary" disabled={create.isPending || update.isPending} onClick={handleSubmit(onSubmit)}>{editing ? "Save" : "Create"}</Button></>}>
        <div className="space-y-3">
          <Field label="Rule code" error={errors.code?.message}><TextInput {...register("code")} placeholder="TEMP_HIGH" /></Field>
          <Field label="Name" error={errors.name?.message}><TextInput {...register("name")} placeholder="Temperature Above Setpoint" /></Field>
          <Field label="Condition" error={errors.condition?.message}><TextInput {...register("condition")} placeholder="temp > setpoint + 2°C" /></Field>
          <Field label="Severity" error={errors.severity?.message}>
            <SelectInput {...register("severity")}>
              {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </SelectInput>
          </Field>
        </div>
      </Modal>

      {/* Delete confirm modal */}
      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete rule"
        footer={<><Button onClick={() => setDeleting(null)}>Cancel</Button><button disabled={remove.isPending} onClick={doDelete} className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60">Delete</button></>}>
        <p className="text-sm text-slate-600">Delete rule <span className="font-semibold">{deleting?.code}</span> — <span className="italic">{deleting?.name}</span>? This will stop all alerts triggered by this rule.</p>
      </Modal>
    </div>
  );
}
