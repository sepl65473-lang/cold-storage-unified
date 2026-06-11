import { Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./app/layout/AppLayout.jsx";
import { ProtectedRoute } from "./features/auth/ProtectedRoute.jsx";
import { RequirePerm } from "./features/auth/RequirePerm.jsx";
import { LoginPage } from "./features/auth/LoginPage.jsx";
import { DashboardPage } from "./features/dashboard/DashboardPage.jsx";
import { ProducePage } from "./features/produce/ProducePage.jsx";
import { ChambersPage } from "./features/chambers/ChambersPage.jsx";
import { DevicesPage } from "./features/devices/DevicesPage.jsx";
import { GatewaysPage } from "./features/gateways/GatewaysPage.jsx";
import { AlertsPage } from "./features/alerts/AlertsPage.jsx";
import { NotificationsPage } from "./features/alerts/NotificationsPage.jsx";
import { WorkOrdersPage } from "./features/logistics/WorkOrdersPage.jsx";
import { DispatchPage } from "./features/logistics/DispatchPage.jsx";
import { InventoryPage } from "./features/inventory/InventoryPage.jsx";
import { ReportsPage } from "./features/reports/ReportsPage.jsx";
import { AuditLogsPage } from "./features/reports/AuditLogsPage.jsx";
import { UsersPage } from "./features/users/UsersPage.jsx";
import { RolesPage } from "./features/users/RolesPage.jsx";
import { SettingsPage } from "./features/settings/SettingsPage.jsx";
import { SearchPage } from "./features/search/SearchPage.jsx";

const guard = (perm, el) => <RequirePerm perm={perm}>{el}</RequirePerm>;

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={guard("dashboard", <DashboardPage />)} />
        <Route path="produce" element={guard("produce", <ProducePage />)} />
        <Route path="chambers" element={guard("chambers", <ChambersPage />)} />
        <Route path="devices" element={guard("devices", <DevicesPage />)} />
        <Route path="gateways" element={guard("gateways", <GatewaysPage />)} />
        <Route path="alerts" element={guard("alerts", <AlertsPage />)} />
        <Route path="notifications" element={guard("notifications", <NotificationsPage />)} />
        <Route path="work-orders" element={guard("work_orders", <WorkOrdersPage />)} />
        <Route path="dispatch" element={guard("dispatch", <DispatchPage />)} />
        <Route path="inventory" element={guard("inventory", <InventoryPage />)} />
        <Route path="reports" element={guard("reports", <ReportsPage />)} />
        <Route path="audit" element={guard("audit", <AuditLogsPage />)} />
        <Route path="users" element={guard("users", <UsersPage />)} />
        <Route path="roles" element={guard("roles", <RolesPage />)} />
        <Route path="settings" element={guard("settings", <SettingsPage />)} />
        <Route path="search" element={<SearchPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
