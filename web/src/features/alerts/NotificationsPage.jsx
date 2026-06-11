import { PageHead } from "../../shared/components/PageHead.jsx";
import { SectionCard } from "../../shared/components/SectionCard.jsx";
import { StateBlock } from "../../shared/components/StateBlock.jsx";
import { Badge } from "../../shared/components/Badge.jsx";
import { Button } from "../../shared/components/Button.jsx";
import { cn } from "../../shared/utils/cn.js";
import { TONE } from "../../shared/utils/tokens.js";
import { useNotifications, useMarkAllRead, useMarkRead } from "./notificationsApi.js";
import { AlertTriangle, Truck, Wrench, CheckCircle2, Power, Box } from "lucide-react";

const ICONS = { alert: AlertTriangle, truck: Truck, wrench: Wrench, check: CheckCircle2, power: Power, box: Box };

export function NotificationsPage() {
  const { notifications, status, refetch } = useNotifications();
  const markAll = useMarkAllRead();
  const markOne = useMarkRead();
  const unread = notifications.filter((n) => n.unread).length;
  return (
    <div className="space-y-4">
      <PageHead title="Notifications" sub="System & operational notifications"><Button onClick={() => markAll.mutate()}>Mark all read</Button></PageHead>
      <SectionCard bodyClassName="p-0" title="Inbox" right={<Badge value={`${unread} unread`} tone="blue" />}>
        {status !== "idle" ? <StateBlock kind={status} onRetry={refetch} /> : (
          <ul className="divide-y divide-slate-50">
            {notifications.map((n) => {
              const Icon = ICONS[n.icon] || Box;
              return (
                <li key={n.id}
                  onClick={() => n.unread && markOne.mutate(n.id)}
                  className={cn("flex items-start gap-3 px-4 py-3 transition", n.unread ? "cursor-pointer bg-blue-50/40 hover:bg-blue-50/70" : "opacity-70")}>
                  <span className={cn("mt-0.5 grid h-8 w-8 place-items-center rounded-md", TONE[n.tone])}><Icon className="h-4 w-4" /></span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">{n.title}</p>
                    <p className="text-xs text-slate-500">{n.sub}</p>
                  </div>
                  {n.unread
                    ? <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600" title="Click to mark as read" />
                    : <span className="mt-1 text-[10px] text-slate-300">Read</span>
                  }
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
