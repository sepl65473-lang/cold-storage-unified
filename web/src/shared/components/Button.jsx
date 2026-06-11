import { cn } from "../utils/cn.js";

export function Button({ icon: Icon, children, variant = "default", className, ...props }) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition",
        variant === "primary"
          ? "bg-blue-700 text-white shadow-sm hover:bg-blue-800"
          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
        className
      )}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {children}
    </button>
  );
}
