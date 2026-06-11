export function Legend({ items }) {
  return (
    <div className="mt-2 flex flex-wrap gap-3">
      {items.map(([label, color]) => (
        <span key={label} className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <span className="h-2 w-2 rounded-full" style={{ background: color }} /> {label}
        </span>
      ))}
    </div>
  );
}
