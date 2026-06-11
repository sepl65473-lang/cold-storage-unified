import { useSearchParams, useNavigate } from "react-router-dom";
import { PageHead } from "../../shared/components/PageHead.jsx";
import { Badge } from "../../shared/components/Badge.jsx";
import { StateBlock } from "../../shared/components/StateBlock.jsx";
import { MONO } from "../../shared/utils/tokens.js";
import { useChambers } from "../chambers/api.js";
import { useDevices } from "../devices/api.js";
import { useAlerts } from "../alerts/api.js";
import { useWorkOrders, useDispatch } from "../logistics/api.js";
import { useInventory } from "../inventory/api.js";
import { Layers, Cpu, AlertTriangle, ClipboardList, Truck, Package, ArrowRight } from "lucide-react";

const MAX = 5;

function ResultSection({ icon: Icon, title, href, items, renderItem, total, loading }) {
  const navigate = useNavigate();
  if (loading) return null;
  if (!items.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-semibold text-slate-800">{title}</span>
          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">{items.length}{total > MAX ? "+" : ""}</span>
        </div>
        <button onClick={() => navigate(href)} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
          See all <ArrowRight className="h-3 w-3" />
        </button>
      </div>
      <ul className="divide-y divide-slate-50">
        {items.slice(0, MAX).map((item, i) => (
          <li key={i} onClick={() => navigate(href)} className="flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-slate-50">
            {renderItem(item)}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get("q") || "";

  const { rows: chambers,    status: csStatus  } = useChambers({ search: q });
  const { rows: devices,     status: dvStatus  } = useDevices({ search: q });
  const { rows: alerts,      status: alStatus  } = useAlerts({ search: q });
  const { rows: workOrders,  status: woStatus  } = useWorkOrders({ search: q });
  const { rows: dispatches,  status: dpStatus  } = useDispatch({ search: q });
  const { rows: inventory,   status: ivStatus  } = useInventory({ search: q });

  const loading = [csStatus, dvStatus, alStatus, woStatus, dpStatus, ivStatus].some((s) => s === "loading");
  const totalHits = chambers.length + devices.length + alerts.length + workOrders.length + dispatches.length + inventory.length;

  if (!q) return (
    <div className="space-y-4">
      <PageHead title="Search" sub="Search across all entities" />
      <StateBlock kind="empty" message="Enter a search term in the top bar to begin." />
    </div>
  );

  return (
    <div className="space-y-4">
      <PageHead title="Search results" sub={loading ? "Searching…" : `${totalHits} results for "${q}"`} />
      {loading && <StateBlock kind="loading" />}
      {!loading && totalHits === 0 && (
        <StateBlock kind="empty" message={`No results found for "${q}". Try a different term.`} />
      )}
      <ResultSection icon={Layers} title="Chambers" href="/chambers" items={chambers} total={chambers.length}
        renderItem={(r) => (
          <>
            <span className="w-20 shrink-0 text-xs font-medium text-slate-700" style={{ fontFamily: MONO }}>{r.id}</span>
            <span className="flex-1 text-sm text-slate-700">{r.name}</span>
            <Badge value={r.status} dot />
          </>
        )}
      />
      <ResultSection icon={Cpu} title="Devices" href="/devices" items={devices} total={devices.length}
        renderItem={(r) => (
          <>
            <span className="w-24 shrink-0 text-xs font-medium text-slate-700" style={{ fontFamily: MONO }}>{r.id}</span>
            <span className="flex-1 text-sm text-slate-700">{r.name} — {r.type}</span>
            <Badge value={r.status} dot />
          </>
        )}
      />
      <ResultSection icon={AlertTriangle} title="Alerts" href="/alerts" items={alerts} total={alerts.length}
        renderItem={(r) => (
          <>
            <span className="w-24 shrink-0 text-xs font-medium text-slate-700" style={{ fontFamily: MONO }}>{r.id}</span>
            <span className="flex-1 text-sm text-slate-700">{r.title}</span>
            <Badge value={r.sev} />
          </>
        )}
      />
      <ResultSection icon={ClipboardList} title="Work Orders" href="/work-orders" items={workOrders} total={workOrders.length}
        renderItem={(r) => (
          <>
            <span className="w-20 shrink-0 text-xs font-medium text-slate-700" style={{ fontFamily: MONO }}>{r.id}</span>
            <span className="flex-1 text-sm text-slate-700">{r.title}</span>
            <Badge value={r.priority} />
          </>
        )}
      />
      <ResultSection icon={Truck} title="Dispatch" href="/dispatch" items={dispatches} total={dispatches.length}
        renderItem={(r) => (
          <>
            <span className="w-24 shrink-0 text-xs font-medium text-slate-700" style={{ fontFamily: MONO }}>{r.id}</span>
            <span className="flex-1 text-sm text-slate-700">{r.vehicle} → {r.dest}</span>
            <Badge value={r.status} dot />
          </>
        )}
      />
      <ResultSection icon={Package} title="Inventory" href="/inventory" items={inventory} total={inventory.length}
        renderItem={(r) => (
          <>
            <span className="w-24 shrink-0 text-xs font-medium text-slate-700" style={{ fontFamily: MONO }}>{r.id}</span>
            <span className="flex-1 text-sm text-slate-700">{r.product}</span>
            <Badge value={r.status} dot />
          </>
        )}
      />
    </div>
  );
}
