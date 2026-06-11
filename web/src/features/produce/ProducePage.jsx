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
import { SectionCard } from "../../shared/components/SectionCard.jsx";
import { cn } from "../../shared/utils/cn.js";
import { downloadCsv } from "../../shared/utils/download.js";
import { useProduce, useCreateProduce, useUpdateProduce, useDeleteProduce } from "./api.js";
import { useChambers } from "../chambers/api.js";
import { Plus, Download } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  category: z.string().min(1, "Category is required"),
  variety: z.string().min(1, "Variety is required"),
  chamber: z.string().min(1, "Chamber is required"),
  tempRequired: z.string().min(1, "Temp range is required"),
  pallets: z.coerce.number({ invalid_type_error: "Number required" }).min(1),
  origin: z.string().min(1, "Origin is required"),
  expiry: z.string().min(1, "Expiry is required"),
  quality: z.string().min(1, "Quality is required"),
});

const QUALITY_TONE = {
  Fresh: "emerald",
  Good: "blue",
  Fair: "amber",
  "Expiring Soon": "red",
};

export function ProducePage() {
  const { rows, total, status, refetch } = useProduce();
  const { rows: chambers } = useChambers();
  const create = useCreateProduce();
  const update = useUpdateProduce();
  const remove = useDeleteProduce();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { category: "Fruit", quality: "Fresh", pallets: 1 },
  });

  const openCreate = () => { setEditing(null); reset({ category: "Fruit", quality: "Fresh", pallets: 1 }); setOpen(true); };
  const openEdit = (row) => { setEditing(row); reset(row); setOpen(true); };
  const closeModal = () => { setOpen(false); setEditing(null); };

  const onSubmit = (data) => {
    const payload = {
      ...(editing || {}),
      ...data,
      weight: `${data.pallets * 150} kg`,
    };
    const action = editing ? update : create;
    action.mutate(payload, { onSuccess: () => { reset(); closeModal(); } });
  };

  // KPI stats
  const fruits = rows.filter((r) => r.category === "Fruit");
  const vegetables = rows.filter((r) => r.category === "Vegetable");
  const expiringSoon = rows.filter((r) => r.quality === "Expiring Soon");
  const totalPallets = rows.reduce((s, r) => s + Number(r.pallets || 0), 0);

  const cols = [
    { key: "id",           label: "ID",           mono: true },
    { key: "name",         label: "Item" },
    { key: "variety",      label: "Variety" },
    { key: "category",     label: "Category",     render: (v) => <Badge value={v} tone={v === "Fruit" ? "emerald" : "blue"} /> },
    { key: "chamber",      label: "Chamber",      mono: true },
    { key: "tempRequired", label: "Req. Temp",    mono: true },
    { key: "currentTemp",  label: "Live Temp (°C)", mono: true, render: (v) => <span className={cn(typeof v === "number" && v > 15 ? "text-red-500 font-semibold" : "text-slate-700")}>{v}</span> },
    { key: "pallets",      label: "Pallets",      mono: true },
    { key: "weight",       label: "Weight",       mono: true },
    { key: "origin",       label: "Origin" },
    { key: "received",     label: "Received" },
    { key: "expiry",       label: "Expiry",       render: (v) => <span className={cn(String(v).includes("Expiring") ? "font-medium text-amber-600" : "text-slate-600")}>{v}</span> },
    { key: "quality",      label: "Quality",      render: (v) => <Badge value={v} dot tone={QUALITY_TONE[v] || "slate"} /> },
  ];

  const chamberOptions = (chambers.length ? chambers.map((c) => c.id) : ["CH-01","CH-03","CH-05"]).map((id) => ({ value: id, label: id }));
  const categoryOptions = ["Fruit", "Vegetable"].map((c) => ({ value: c, label: c }));
  const qualityOptions = ["Fresh", "Good", "Fair", "Expiring Soon"].map((q) => ({ value: q, label: q }));

  return (
    <div className="space-y-4">
      <PageHead title="Fruits & Vegetables" sub="Fresh produce inventory across cold storage chambers">
        <Button icon={Download} onClick={() => downloadCsv(`produce_report_${Date.now()}`, cols, rows)}>Export</Button>
        <Button icon={Plus} variant="primary" onClick={openCreate}>Add Produce</Button>
      </PageHead>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Total Items" value={String(total || rows.length)} tone="blue" />
        <StatTile label="Fruits" value={String(fruits.length)} tone="emerald" />
        <StatTile label="Vegetables" value={String(vegetables.length)} tone="amber" />
        <StatTile label="Expiring Soon" value={String(expiringSoon.length)} tone="red" />
      </div>

      {/* Expiring soon alert strip */}
      {expiringSoon.length > 0 && (
        <SectionCard title="Action Required" subtitle="Items expiring within 3 days">
          <div className="flex flex-wrap gap-2">
            {expiringSoon.map((r) => (
              <div key={r.id} className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                <span className="font-medium text-red-700">{r.name}</span>
                <span className="text-xs text-red-400">{r.chamber} · {r.expiry}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Category split */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <SectionCard title="Fruits in Storage" subtitle={`${fruits.length} varieties · ${fruits.reduce((s, r) => s + Number(r.pallets || 0), 0)} pallets`}>
          <div className="space-y-2">
            {fruits.slice(0, 6).map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500">●</span>
                  <span className="font-medium text-slate-700">{r.name}</span>
                  <span className="text-xs text-slate-400">{r.variety}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>{r.chamber}</span>
                  <span className="font-mono">{r.tempRequired}</span>
                  <Badge value={r.quality} tone={QUALITY_TONE[r.quality] || "slate"} />
                </div>
              </div>
            ))}
            {fruits.length > 6 && <p className="text-xs text-slate-400">+{fruits.length - 6} more</p>}
          </div>
        </SectionCard>

        <SectionCard title="Vegetables in Storage" subtitle={`${vegetables.length} varieties · ${vegetables.reduce((s, r) => s + Number(r.pallets || 0), 0)} pallets`}>
          <div className="space-y-2">
            {vegetables.slice(0, 6).map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-blue-500">●</span>
                  <span className="font-medium text-slate-700">{r.name}</span>
                  <span className="text-xs text-slate-400">{r.variety}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>{r.chamber}</span>
                  <span className="font-mono">{r.tempRequired}</span>
                  <Badge value={r.quality} tone={QUALITY_TONE[r.quality] || "slate"} />
                </div>
              </div>
            ))}
            {vegetables.length > 6 && <p className="text-xs text-slate-400">+{vegetables.length - 6} more</p>}
          </div>
        </SectionCard>
      </div>

      {/* Full data table */}
      <DataTable
        title="Produce Ledger"
        subtitle={`${total || rows.length} items · ${totalPallets} total pallets`}
        columns={cols}
        rows={rows}
        getId={(r) => r.id}
        status={status}
        onRetry={refetch}
        searchKeys={["id", "name", "variety", "category", "chamber", "origin", "quality"]}
        pageSize={10}
        onEdit={openEdit}
        onDelete={(row) => remove.mutate(row.id)}
        filters={[
          { key: "category", label: "Category", options: ["Fruit", "Vegetable"] },
          { key: "quality",  label: "Quality",  options: ["Fresh", "Good", "Fair", "Expiring Soon"] },
        ]}
        batchActions={[
          { label: "Delete selected", onClick: (ids, clear) => { if (window.confirm(`Delete ${ids.length} items?`)) { ids.forEach((id) => remove.mutate(id)); clear(); } } },
        ]}
      />

      <Modal
        open={open}
        onClose={closeModal}
        title={editing ? "Edit Produce" : "Add Produce"}
        footer={
          <>
            <Button onClick={closeModal}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit(onSubmit)}>
              {create.isPending || update.isPending ? "Saving..." : editing ? "Save Changes" : "Add Item"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Name" error={errors.name?.message}>
            <TextInput register={register} name="name" error={errors.name} placeholder="Alphonso Mango" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category" error={errors.category?.message}>
              <SelectInput register={register} name="category" error={errors.category} options={categoryOptions} />
            </Field>
            <Field label="Variety" error={errors.variety?.message}>
              <TextInput register={register} name="variety" error={errors.variety} placeholder="e.g. Alphonso" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Chamber" error={errors.chamber?.message}>
              <SelectInput register={register} name="chamber" error={errors.chamber} options={chamberOptions} />
            </Field>
            <Field label="Temp Required" error={errors.tempRequired?.message}>
              <TextInput register={register} name="tempRequired" error={errors.tempRequired} placeholder="e.g. 8-12°C" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Pallets" error={errors.pallets?.message}>
              <TextInput register={register} name="pallets" error={errors.pallets} type="number" />
            </Field>
            <Field label="Origin" error={errors.origin?.message}>
              <TextInput register={register} name="origin" error={errors.origin} placeholder="e.g. Nashik" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Expiry Date" error={errors.expiry?.message}>
              <TextInput register={register} name="expiry" error={errors.expiry} placeholder="e.g. 18 Jun" />
            </Field>
            <Field label="Quality" error={errors.quality?.message}>
              <SelectInput register={register} name="quality" error={errors.quality} options={qualityOptions} />
            </Field>
          </div>
        </div>
      </Modal>
    </div>
  );
}
