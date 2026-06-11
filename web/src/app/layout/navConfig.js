import {
  LayoutDashboard, Leaf, Box, Cpu, Router, AlertTriangle, Bell, ClipboardList,
  Truck, Package, FileBarChart, ScrollText, Users, ShieldCheck, Settings,
} from "lucide-react";

export const NAV = [
  { group: "Operations", items: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, perm: "dashboard" },
    { to: "/produce", label: "Fruits & Vegetables", icon: Leaf, perm: "produce" },
    { to: "/chambers", label: "Chambers", icon: Box, perm: "chambers" },
    { to: "/devices", label: "Devices", icon: Cpu, perm: "devices" },
    { to: "/gateways", label: "Gateways", icon: Router, perm: "gateways" },
  ]},
  { group: "Alerts", items: [
    { to: "/alerts", label: "Alerts", icon: AlertTriangle, perm: "alerts", badge: 4 },
    { to: "/notifications", label: "Notifications", icon: Bell, perm: "notifications" },
  ]},
  { group: "Logistics", items: [
    { to: "/work-orders", label: "Work Orders", icon: ClipboardList, perm: "work_orders", badge: 2 },
    { to: "/dispatch", label: "Dispatch Operations", icon: Truck, perm: "dispatch" },
    { to: "/inventory", label: "Inventory", icon: Package, perm: "inventory" },
  ]},
  { group: "Insights", items: [
    { to: "/reports", label: "Reports", icon: FileBarChart, perm: "reports" },
    { to: "/audit", label: "Audit Logs", icon: ScrollText, perm: "audit" },
  ]},
  { group: "Administration", items: [
    { to: "/users", label: "Users", icon: Users, perm: "users" },
    { to: "/roles", label: "Roles & Permissions", icon: ShieldCheck, perm: "roles" },
    { to: "/settings", label: "Settings", icon: Settings, perm: "settings" },
  ]},
];
