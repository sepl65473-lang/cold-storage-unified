import { NavLink } from "react-router-dom";
import { cn } from "../../shared/utils/cn.js";
import { NAV } from "./navConfig.js";
import { usePermissions } from "../../shared/auth/permissions.js";
import { useRealtimeStore } from "../../stores/realtimeStore.js";
import logo from "../../assets/sepl-logo.jpg";

export function Sidebar({ collapsed }) {
  const { can } = usePermissions();
  const connected = useRealtimeStore((s) => s.connected);
  return (
    <aside className={cn("flex shrink-0 flex-col bg-slate-900 text-slate-300 transition-all", collapsed ? "w-16" : "w-60")}>
      <div className="flex h-14 items-center gap-2.5 border-b border-white/5 px-4">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-white"><img src={logo} alt="SEPL" className="h-6 w-6 rounded object-contain" /></div>
        {!collapsed && <div className="leading-tight"><div className="text-sm font-semibold text-white">SEPL ColdChain</div><div className="text-[10px] uppercase tracking-wider text-slate-500">Operations</div></div>}
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {NAV.map((grp) => {
          const items = grp.items.filter((it) => can(it.perm));
          if (!items.length) return null;
          return (
            <div key={grp.group} className="mb-3">
              {!collapsed && <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600">{grp.group}</div>}
              {items.map((it) => {
                const Icon = it.icon;
                return (
                  <NavLink key={it.to} to={it.to} title={it.label}
                    className={({ isActive }) => cn("mb-0.5 flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm transition", isActive ? "bg-blue-600 text-white shadow-sm" : "text-slate-300 hover:bg-white/5 hover:text-white")}>
                    {({ isActive }) => (
                      <>
                        <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                        {!collapsed && <span className="flex-1 text-left">{it.label}</span>}
                        {!collapsed && it.badge && <span className={cn("rounded px-1.5 text-[10px] font-semibold", isActive ? "bg-white/20 text-white" : "bg-red-500/90 text-white")}>{it.badge}</span>}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </nav>
      {!collapsed && (
        <div className="border-t border-white/5 p-3">
          <div className="flex items-center gap-2 rounded-md bg-white/5 px-2.5 py-2">
            <span className="relative flex h-2 w-2">
              {connected && <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-emerald-400 opacity-75" />}
              <span className={cn("relative inline-flex h-2 w-2 rounded-full", connected ? "bg-emerald-500" : "bg-slate-500")} />
            </span>
            <span className="text-xs text-slate-300">{connected ? "Live - telemetry streaming" : "Connecting..."}</span>
          </div>
        </div>
      )}
    </aside>
  );
}
