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
import { downloadCsv } from "../../shared/utils/download.js";
import { useInventory, useCreateInventory, useUpdateInventory, useDeleteInventory } from "./api.js";
import { useChambers } from "../chambers/api.js";
import { Plus, Download } from "lucide-react";

const schema = z.object({
  product: z.string().min(2, "Product is required"),
  category: z.string().min(1, "Category is required"),
  chamber: z.string().min(1, "Chamber is required"),
  pallets: z.coerce.number({ invalid_type_error: "Number required" }).min(0),
});

export function InventoryPage() {
  const { rows, total, status, refetch } = useInventory();
  const { rows: chambers } = useChambers();
  const create = useCreateInventory();
  const update = useUpdateInventory();
  const remove = useDeleteInventory();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema), defaultValues: { category: "Dairy", pallets: 1 },
  });
  const openCreate = () => { setEditing(null); reset({ category: "Dairy", pallets: 1 }); setOpen(true); };
  const openEdit = (row) => { setEditing(row); reset(row); setOpen(true); };
  const closeModal = () => { setOpen(false); setEditing(null); };
  const onSubmit = (data) => {
    const payload = { ...(editing || {}), ...data, weight: `${data.pallets * 25} kg` };
    const action = editing ? update : create;
    action.mutate(payload, { onSuccess: () => { reset(); closeModal(); } });
  };

  const cols = [
    { key: "id", label: "SKU", mono: true },
    { key: "product", label: "Product" },
    { key: "category", label: "Category", render: (v) => <Badge value={v} tone="slate" /> },
    { key: "chamber", label: "Chamber", mono: true },
    { key: "pallets", label: "Pallets", mono: true },
    { key: "weight", label: "Weight", mono: true },
    { key: "received", label: "Received" },
    { key: "expiry", label: "Expiry", render: (v) => <span className={cn(String(v).includes("Expiring") ? "font-medium text-amber-600" : "text-slate-600")}>{v}</span> },
    { key: "status", label: "Status", render: (v) => <Badge value={v} dot /> },
  ];

  const chamberOptions = (chambers.length ? chambers.map((c) => c.id) : ["CH-01"]).map((id) => ({ value: id, label: id }));
  const catOptions = ["Seafood", "Poultry", "Dairy", "Pharma", "Vegetables", "Ice Cream", "Meat"].map((c) => ({ value: c, label: c }));

  return (
    <div className="space-y-4">
      <PageHead title="Inventory" sub="Stored goods across chambers">
        <Button icon={Download} onClick={() => downloadCsv(`stock_report_${Date.now()}`, cols, rows)}>Stock Report</Button>
        <Button icon={Plus} variant="primary" onClick={openCreate}>Inbound</Button>
      </PageHead>
      <DataTable title="Stock Ledger" subtitle={`${total} SKUs`} columns={cols} rows={rows} getId={(r) => r.id} status={status} onRetry={refetch} searchKeys={["id", "product", "category", "chamber", "status"]} pageSize={9} onEdit={openEdit} onDelete={(row) => remove.mutate(row.id)}
        filters={[
          { key: "category", label: "Category", options: ["Seafood", "Poultry", "Dairy", "Pharma", "Vegetables", "Ice Cream", "Meat"] },
          { key: "status",   label: "Status",   options: ["In Stock", "Action Needed"] },
        ]}
        batchActions={[
          { label: "Delete selected", onClick: (ids, clear) => { if (window.confirm(`Delete ${ids.length} SKUs?`)) { ids.forEach((id) => remove.mutate(id)); clear(); } } },
        ]}
      />

      <Modal open={open} onClose={closeModal} title={editing ? "Edit Stock" : "Inbound Stock"}
        footer={<>
          <Button onClick={closeModal}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)}>{create.isPending || update.isPending ? "Saving..." : editing ? "Save Changes" : "Add Stock"}</Button>
        </>}>
        <div className="space-y-3">
          <Field label="Product" error={errors.product?.message}><TextInput register={register} name="product" error={errors.product} placeholder="Seafood Lot 12" /></Field>
          <Field label="Category" error={errors.category?.message}><SelectInput register={register} name="category" error={errors.category} options={catOptions} /></Field>
          <Field label="Chamber" error={errors.chamber?.message}><SelectInput register={register} name="chamber" error={errors.chamber} options={chamberOptions} /></Field>
          <Field label="Pallets" error={errors.pallets?.message}><TextInput register={register} name="pallets" error={errors.pallets} type="number" /></Field>
        </div>
      </Modal>
    </div>
  );
}
