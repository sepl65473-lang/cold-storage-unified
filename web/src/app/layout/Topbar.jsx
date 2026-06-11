import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "../../shared/utils/cn.js";
import { MONO } from "../../shared/utils/tokens.js";
import { useClock } from "../../shared/hooks/useClock.js";
import { useFacilities } from "../../shared/hooks/useFacilities.js";
import { useAuthStore } from "../../stores/authStore.js";
import { useUiStore } from "../../stores/uiStore.js";
import { IS_MOCK } from "../../shared/services/api.js";
import { Menu, Building2, ChevronDown, Search, Clock, Bell, Check, User, Settings, LogOut } from "lucide-react";

export function Topbar({ onToggle }) {
  const clock = useClock();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const { facilities } = useFacilities();
  const facility = useUiStore((s) => s.facility);
  const setFacility = useUiStore((s) => s.setFacility);
  const [openF, setOpenF] = useState(false);
  const [openU, setOpenU] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => { if (!facility && facilities.length) setFacility(facilities[0]); }, [facilities, facility, setFacility]);

  const runSearch = () => {
    const term = q.trim();
    if (!term) return;
    navigate(`/search?q=${encodeURIComponent(term)}`);
    setQ("");
  };

  const initials = (user?.name || "U").split(" ").map((x) => x[0]).slice(0, 2).join("");

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4">
      <button onClick={onToggle} className="rounded-md p-2 text-slate-500 hover:bg-slate-100"><Menu className="h-4 w-4" /></button>

      <div className="relative">
        <button onClick={() => setOpenF((o) => !o)} className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
          <Building2 className="h-4 w-4 text-slate-400" /><span>{facility ? facility.name : "Select facility"}</span><ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        </button>
        {openF && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpenF(false)} />
            <div className="absolute left-0 z-20 mt-1 w-56 rounded-md border border-slate-200 bg-white py-1 shadow-lg">
              {facilities.map((f) => (
                <button key={f.id} onClick={() => { setFacility(f); setOpenF(false); }} className={cn("flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50", facility?.id === f.id ? "text-blue-700" : "text-slate-700")}>
                  <span><span className="font-medium">{f.name}</span><span className="block text-xs text-slate-400">{f.city}</span></span>
                  {facility?.id === f.id && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="relative ml-1 hidden flex-1 md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") runSearch(); }} placeholder="Search chambers, devices, alerts, work orders..." className="w-full max-w-md rounded-md border border-slate-200 bg-slate-50 py-1.5 pl-10 pr-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100" />
      </div>

      <div className="ml-auto flex items-center gap-2.5">
        {IS_MOCK && <span className="hidden rounded bg-amber-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700 sm:inline">Mock data</span>}
        <div className="hidden items-center gap-1.5 rounded-md bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600 ring-1 ring-slate-200 sm:flex" style={{ fontFamily: MONO }}><Clock className="h-3.5 w-3.5 text-slate-400" /> {clock}</div>
        <button onClick={() => navigate("/notifications")} className="relative rounded-md p-2 text-slate-500 hover:bg-slate-100"><Bell className="h-4 w-4" /><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500 ring-2 ring-white" /></button>
        <div className="relative">
          <button onClick={() => setOpenU((o) => !o)} className="flex items-center gap-2 rounded-md py-1 pl-1 pr-2 hover:bg-slate-100">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-blue-700 text-xs font-semibold text-white">{initials}</span>
            <span className="hidden text-left leading-tight sm:block"><span className="block text-xs font-semibold text-slate-800">{user?.name || "User"}</span><span className="block text-[10px] text-slate-400">{user?.role || ""}</span></span>
            <ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 sm:block" />
          </button>
          {openU && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpenU(false)} />
              <div className="absolute right-0 z-20 mt-1 w-48 rounded-md border border-slate-200 bg-white py-1 shadow-lg">
                <div className="border-b border-slate-100 px-3 py-2"><div className="text-sm font-medium text-slate-800">{user?.name}</div><div className="text-xs text-slate-400">{user?.email}</div></div>
                <button onClick={() => { setOpenU(false); navigate("/settings"); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"><User className="h-4 w-4" />Profile</button>
                <button onClick={() => { setOpenU(false); navigate("/settings"); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"><Settings className="h-4 w-4" />Preferences</button>
                <button onClick={() => { logout(); navigate("/login"); }} className="flex w-full items-center gap-2 border-t border-slate-100 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"><LogOut className="h-4 w-4" /> Sign out</button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
