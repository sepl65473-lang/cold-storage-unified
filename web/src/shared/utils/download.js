// Small client-side export helpers. Work with or without a backend.

const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

// columns: [{ key, label }] (or plain strings). rows: array of objects.
export function downloadCsv(filename, columns, rows) {
  const cols = columns.map((c) => (typeof c === "string" ? { key: c, label: c } : c));
  const head = cols.map((c) => c.label).join(",");
  const body = (rows || []).map((r) => cols.map((c) => esc(r[c.key])).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + head + "\n" + body], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
}

// Export a list of [label, value] pairs as a simple two-column CSV (for summaries).
export function downloadSummaryCsv(filename, pairs) {
  downloadCsv(filename, [{ key: "metric", label: "Metric" }, { key: "value", label: "Value" }],
    pairs.map(([metric, value]) => ({ metric, value })));
}

export function downloadExcel(filename, columns, rows) {
  const cols = columns.map((c) => (typeof c === "string" ? { key: c, label: c } : c));
  const cell = (value, tag = "td") => `<${tag}>${String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</${tag}>`;
  const head = `<tr>${cols.map((c) => cell(c.label, "th")).join("")}</tr>`;
  const body = (rows || []).map((row) => `<tr>${cols.map((c) => cell(row[c.key])).join("")}</tr>`).join("");
  const html = `<!doctype html><html><head><meta charset="utf-8" /></head><body><table>${head}${body}</table></body></html>`;
  const blob = new Blob(["\uFEFF" + html], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename.endsWith(".xls") ? filename : `${filename}.xls`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
}
