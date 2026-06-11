import { useEffect, useMemo, useState } from "react";
import { cn } from "../utils/cn.js";
import { MONO } from "../utils/tokens.js";
import { StateBlock } from "./StateBlock.jsx";
import {
  Search, Download, ChevronLeft, ChevronRight, ChevronUp, ChevronDown,
  ArrowUpDown, MoreHorizontal,
} from "lucide-react";

/*
  DataTable
  - Client mode (default): does search/sort/pagination over the rows it is given.
  - Server mode (serverMode + total + page + onPageChange + onSearch + onSort):
    the backend does the heavy lifting; use this for very large datasets
    (thousands of devices). All props are documented in CONTRACT.md.
*/
export function DataTable({
  columns, rows, getId, searchKeys, pageSize = 8, status = "idle", onRetry,
  selectable = true, title, subtitle, actions, onEdit, onDelete,
  filters, batchActions,
  serverMode = false, total, page, onPageChange, search, onSearch, onSort,
}) {
  const [qLocal, setQLocal] = useState("");
  const [sortLocal, setSortLocal] = useState(null);
  const [pageLocal, setPageLocal] = useState(1);
  const [sel, setSel] = useState(() => new Set());
  const [menu, setMenu] = useState(null);
  const [filterValues, setFilterValues] = useState({});
  const setFilter = (key, val) => { setFilterValues((prev) => ({ ...prev, [key]: val })); };
  const clearFilters = () => setFilterValues({});
  const hasActiveFilters = Object.values(filterValues).some(Boolean);

  const q = serverMode ? (search || "") : qLocal;
  const setQ = serverMode ? (v) => onSearch && onSearch(v) : setQLocal;

  const filtered = useMemo(() => {
    if (serverMode) return rows || [];
    let r = rows || [];
    if (qLocal.trim()) {
      const t = qLocal.toLowerCase();
      r = r.filter((row) => (searchKeys || Object.keys(row)).some((k) => String(row[k] ?? "").toLowerCase().includes(t)));
    }
    Object.entries(filterValues).forEach(([key, val]) => {
      if (val) r = r.filter((row) => String(row[key] ?? "") === val);
    });
    if (sortLocal) {
      r = [...r].sort((a, b) => {
        const x = a[sortLocal.key], y = b[sortLocal.key];
        const nx = parseFloat(x), ny = parseFloat(y);
        const num = !isNaN(nx) && !isNaN(ny) && /^-?\d/.test(String(x));
        const cmp = num ? nx - ny : String(x).localeCompare(String(y));
        return sortLocal.dir === "asc" ? cmp : -cmp;
      });
    }
    return r;
  }, [rows, qLocal, filterValues, sortLocal, searchKeys, serverMode]);

  const totalRows = serverMode ? (total || 0) : filtered.length;
  const pages = Math.max(1, Math.ceil(totalRows / pageSize));
  const cur = serverMode ? (page || 1) : Math.min(pageLocal, pages);
  const view = serverMode ? (rows || []) : filtered.slice((cur - 1) * pageSize, cur * pageSize);
  useEffect(() => { if (!serverMode) setPageLocal(1); }, [qLocal, filterValues, sortLocal, serverMode]);

  const goTo = (p) => (serverMode ? onPageChange && onPageChange(p) : setPageLocal(p));
  const doSort = (key) => {
    if (serverMode) { onSort && onSort(key); return; }
    setSortLocal((s) => ({ key, dir: s?.key === key && s.dir === "asc" ? "desc" : "asc" }));
  };

  const allOn = view.length > 0 && view.every((r) => sel.has(getId(r)));
  const toggleAll = () => {
    const n = new Set(sel);
    if (allOn) view.forEach((r) => n.delete(getId(r)));
    else view.forEach((r) => n.add(getId(r)));
    setSel(n);
  };
  const toggle = (id) => { const n = new Set(sel); n.has(id) ? n.delete(id) : n.add(id); setSel(n); };

  const exportRows = (rowsToExport, suffix = "") => {
    const head = columns.map((c) => c.label).join(",");
    const body = (rowsToExport || []).map((r) => columns.map((c) => `"${String(r[c.key] ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + head + "\n" + body], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${(title || "export").replace(/\s+/g, "_").toLowerCase()}${suffix}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const exportCsv = () => exportRows(filtered.length ? filtered : view);
  const exportSelected = () => exportRows((rows || []).filter((r) => sel.has(getId(r))), "_selected");
  const copyId = (id) => { navigator.clipboard && navigator.clipboard.writeText(String(id)); setMenu(null); };
  const editRow = (row) => { onEdit && onEdit(row); setMenu(null); };
  const deleteRow = (row) => {
    const id = getId(row);
    if (window.confirm(`Delete ${id}?`)) onDelete && onDelete(row);
    setMenu(null);
  };

  const showTable = status === "idle" && view.length > 0;

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <div>
            {title && <h3 className="text-sm font-semibold tracking-tight text-slate-800">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
          {selectable && sel.size > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-md bg-blue-50 px-2.5 py-1 ring-1 ring-inset ring-blue-200">
              <span className="text-xs font-medium text-blue-700">{sel.size} selected</span>
              {(batchActions || []).map((a) => (
                <button key={a.label} onClick={() => a.onClick(Array.from(sel), () => setSel(new Set()))}
                  className="inline-flex items-center gap-1 rounded bg-blue-700 px-2 py-0.5 text-[11px] font-medium text-white hover:bg-blue-800">
                  {a.Icon && <a.Icon className="h-3 w-3" />}{a.label}
                </button>
              ))}
              <button onClick={exportSelected} className="text-xs font-medium text-blue-700 hover:underline">Export</button>
              <span className="text-blue-200">|</span>
              <button onClick={() => setSel(new Set())} className="text-xs font-medium text-slate-500 hover:underline">Clear</button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..."
              className="w-44 rounded-md border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-2 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100" />
          </div>
          <button onClick={exportCsv} className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
          {actions}
        </div>
      </div>
      {filters && filters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-50 px-4 py-2">
          <span className="text-[11px] font-medium text-slate-400">Filter:</span>
          {filters.map((f) => (
            <select key={f.key} value={filterValues[f.key] || ""} onChange={(e) => setFilter(f.key, e.target.value)}
              className={cn("rounded border py-1 pl-2 pr-5 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100", filterValues[f.key] ? "border-blue-400 bg-blue-50 text-blue-700" : "border-slate-200 bg-slate-50 text-slate-600")}>
              <option value="">All {f.label}</option>
              {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          ))}
          {hasActiveFilters && (
            <button onClick={clearFilters} className="rounded border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-500 hover:bg-slate-50">Clear filters</button>
          )}
        </div>
      )}
      </div>

      {showTable ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left">
                {selectable && (
                  <th className="w-9 px-4 py-2">
                    <input type="checkbox" checked={allOn} onChange={toggleAll} className="h-3.5 w-3.5 rounded border-slate-300 accent-blue-600" />
                  </th>
                )}
                {columns.map((c) => (
                  <th key={c.key} className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    <button onClick={() => c.sortable !== false && doSort(c.key)} className={cn("inline-flex items-center gap-1", c.sortable !== false && "hover:text-slate-800")}>
                      {c.label}
                      {c.sortable !== false && (!serverMode && sortLocal?.key === c.key
                        ? (sortLocal.dir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)
                        : <ArrowUpDown className="h-3 w-3 text-slate-300" />)}
                    </button>
                  </th>
                ))}
                <th className="w-10 px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {view.map((row) => {
                const id = getId(row);
                return (
                  <tr key={id} className={cn("border-b border-slate-50 hover:bg-blue-50/40", sel.has(id) && "bg-blue-50/60")}>
                    {selectable && (
                      <td className="px-4 py-2.5">
                        <input type="checkbox" checked={sel.has(id)} onChange={() => toggle(id)} className="h-3.5 w-3.5 rounded border-slate-300 accent-blue-600" />
                      </td>
                    )}
                    {columns.map((c) => (
                      <td key={c.key} className={cn("px-3 py-2.5 text-slate-700", c.mono && "tabular-nums")} style={c.mono ? { fontFamily: MONO } : undefined}>
                        {c.render ? c.render(row[c.key], row) : row[c.key]}
                      </td>
                    ))}
                    <td className="px-3 py-2.5 text-right">
                      <div className="relative inline-block">
                        <button onClick={() => setMenu(menu === id ? null : id)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        {menu === id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setMenu(null)} />
                            <div className="absolute right-0 z-20 mt-1 w-40 rounded-md border border-slate-200 bg-white py-1 text-left shadow-lg">
                              {onEdit && <button onClick={() => editRow(row)} className="block w-full px-3 py-1.5 text-left text-xs text-slate-600 hover:bg-slate-50">Edit</button>}
                              {onDelete && <button onClick={() => deleteRow(row)} className="block w-full px-3 py-1.5 text-left text-xs text-red-600 hover:bg-red-50">Delete</button>}
                              <button onClick={() => { exportRows([row], `_${id}`); setMenu(null); }} className="block w-full px-3 py-1.5 text-left text-xs text-slate-600 hover:bg-slate-50">Export row</button>
                              <button onClick={() => copyId(id)} className="block w-full px-3 py-1.5 text-left text-xs text-slate-600 hover:bg-slate-50">Copy ID</button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <StateBlock kind={status === "idle" ? "empty" : status} onRetry={onRetry} />
      )}

      {showTable && (
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5 text-xs text-slate-500">
          <span>Showing {(cur - 1) * pageSize + 1}-{Math.min(cur * pageSize, totalRows)} of {totalRows}</span>
          <div className="flex items-center gap-1">
            <button disabled={cur <= 1} onClick={() => goTo(cur - 1)} className="inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-1 hover:bg-slate-50 disabled:opacity-40">
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </button>
            {Array.from({ length: pages }).slice(0, 6).map((_, i) => (
              <button key={i} onClick={() => goTo(i + 1)} style={{ minWidth: 28 }}
                className={cn("rounded border px-2 py-1", cur === i + 1 ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 hover:bg-slate-50")}>{i + 1}</button>
            ))}
            <button disabled={cur >= pages} onClick={() => goTo(cur + 1)} className="inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-1 hover:bg-slate-50 disabled:opacity-40">
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
