import { cn } from "../utils/cn.js";

// Lightweight field wrapper used with react-hook-form's register().
export function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <div className="mt-1">{children}</div>
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

export const inputCls = (hasError) =>
  cn(
    "w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2",
    hasError ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
  );

export function TextInput({ register, name, error, ...props }) {
  return <input {...register(name)} {...props} className={inputCls(!!error)} />;
}

export function SelectInput({ register, name, error, options, ...props }) {
  return (
    <select {...register(name)} {...props} className={inputCls(!!error)}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
