import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar.jsx";
import { Topbar } from "./Topbar.jsx";
import { useUiStore } from "../../stores/uiStore.js";
import { useRealtime } from "../../shared/hooks/useRealtime.js";

export function AppLayout() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggle = useUiStore((s) => s.toggleSidebar);
  useRealtime(true); // open the live telemetry channel

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 font-sans text-slate-900">
      <Sidebar collapsed={collapsed} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onToggle={toggle} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6"><div className="mx-auto max-w-7xl"><Outlet /></div></main>
      </div>
    </div>
  );
}
