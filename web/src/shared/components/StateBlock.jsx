import { cn } from "../utils/cn.js";
import { Loader2, Inbox, AlertCircle, RefreshCw } from "lucide-react";

export function StateBlock({ kind, onRetry, message }) {
  const map = {
    loading: { icon: Loader2, spin: true, title: "Loading data...",      sub: "Fetching latest telemetry from gateways." },
    empty:   { icon: Inbox,         title: "Nothing to show",            sub: "No records match the current filters." },
    error:   { icon: AlertCircle,   title: "Couldn't load data",         sub: "The telemetry service did not respond. Check connection and retry." },
  }[kind] || { icon: Inbox, title: "Nothing to show", sub: "" };
  const Icon = map.icon;
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-14 text-center">
      <Icon className={cn("h-7 w-7", kind === "error" ? "text-red-400" : "text-slate-300", map.spin && "animate-spin")} />
      <p className="text-sm font-medium text-slate-700">{map.title}</p>
      <p className="max-w-sm text-xs text-slate-500">{message || map.sub}</p>
      {kind === "error" && onRetry && (
        <button onClick={onRetry} className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700">
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </button>
      )}
    </div>
  );
}
