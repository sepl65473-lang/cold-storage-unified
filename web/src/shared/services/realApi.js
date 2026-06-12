// Real backend adapter — maps local FastAPI backend responses
// to the shapes the frontend components expect.
import { http } from "./httpClient.js";
import { EP } from "./endpoints.js";
import { ENV } from "../../config/env.js";

// Role → frontend permission list mapping
const ALL_PERMS = ["dashboard","produce","chambers","devices","gateways","alerts","notifications","work_orders","dispatch","inventory","reports","audit","users","roles","settings"];
const ROLE_PERMS = {
  superadmin:  ALL_PERMS,
  super_admin: ALL_PERMS,
  admin:       ALL_PERMS,
  operator:    ["dashboard","produce","chambers","devices","alerts","notifications","work_orders","dispatch","inventory"],
  viewer:      ["dashboard","produce","alerts","notifications"],
};

const normUser = (u) => {
  const roleName = u.role?.name || (typeof u.role === "string" ? u.role : "");
  return {
    id: u._id || u.id,
    name: u.name || u.email || "-",
    email: u.email,
    role: roleName,
    permissions: ROLE_PERMS[roleName] || [],
    facility: u.facility || "",
    status: u.is_active === false || u.isActive === false ? "Inactive" : "Active",
    last: u.lastLogin || u.last_login || u.updatedAt || u.updated_at || "-",
    phone: u.phone || "",
    assignedDevices: u.assignedDevices || [],
  };
};

// Backend DeviceResponse fields: id, name, location_label, firmware_version, last_seen, is_active, status
const normDevice = (d) => ({
  id: d.id || d._id,
  name: d.name,
  type: d.type || "IoT Sensor",
  chamber: d.location_label || d.location || "-",
  gateway: "-",
  status: d.status === "online" ? "Online"
         : d.status === "offline" ? "Offline"
         : d.status === "warning" ? "Warning"
         : (d.status || "Offline"),
  battery: d.battery ?? "-",
  rssi: d.rssi ?? "-",
  firmware: d.firmware_version || d.firmware || "-",
  lastSeen: d.last_seen || d.lastSeen || d.updatedAt || "-",
  deviceId: d.id,
  isActive: d.is_active ?? d.isActive,
});

const SEV_MAP = { critical: "Critical", high: "High", medium: "Medium", low: "Low" };

// Backend Alert model fields: type, is_resolved, device_id, created_at, severity, message
const normAlert = (a) => ({
  id: a._id || a.id,
  sev: SEV_MAP[a.severity?.toLowerCase()] || a.severity || "Low",
  chamber: a.device_id || a.deviceId || "-",
  title: a.message || (a.type || a.alertType || "Alert").replace(/_/g, " "),
  status: a.is_resolved
    ? "Resolved"
    : a.status === "acknowledged" ? "Acknowledged"
    : "Open",
  age: a.created_at
    ? new Date(a.created_at).toLocaleDateString("en-IN")
    : a.createdAt ? new Date(a.createdAt).toLocaleDateString("en-IN")
    : "-",
  owner: a.resolved_by || a.acknowledgedBy?.email || "-",
  rule: a.type || a.alertType || "-",
  alertType: a.type || a.alertType,
  deviceId: a.device_id || a.deviceId,
});

// Backend endpoints return raw arrays [], not { data: [], meta: {} }
const unwrap = (res) =>
  Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);

// Empty stubs for endpoints the backend does not have yet
const emptyList = async () => ({ data: [], total: 0 });
const okStub    = async () => ({ ok: true });

export const api = {
  // ── Auth ─────────────────────────────────────────────────────────────────
  login: async (email, password) => {
    const res = await http.post(EP.login, { email, password });
    const d = res?.data || res;
    // Backend returns snake_case access_token, no user object
    const token = d.access_token || d.accessToken || d.token;
    if (!token) throw new Error("Login failed: no token received");

    // Fetch user profile with the fresh token (before authStore.setSession is called)
    const meRes = await fetch(`${ENV.API_BASE_URL}${EP.me}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json()).catch(() => null);

    const user = normUser(meRes?.data || meRes || {});
    return { token, user };
  },
  me: async () => {
    const res = await http.get(EP.me);
    return normUser(res?.data || res);
  },

  // ── Facilities (not in backend) ──────────────────────────────────────────
  getFacilities: async () => [],

  // ── Chambers ─────────────────────────────────────────────────────────────
  getChambers: async (params) => {
    const res = await http.get(EP.chambers, params);
    const arr = unwrap(res);
    return {
      data: arr.map((c) => ({
        id: c.id,
        name: c.name,
        temp: c.temp,
        humidity: c.humidity,
        status: c.status === "online" ? "Healthy" : "Offline",
        doors: c.doorStatus === "open" ? "Open" : "Closed",
      })),
      total: arr.length,
    };
  },
  createChamber: okStub,
  updateChamber: okStub,
  deleteChamber: okStub,

  // ── Devices ──────────────────────────────────────────────────────────────
  getDevices: async (params) => {
    const res = await http.get(EP.devices, params);
    const arr = unwrap(res);
    return { data: arr.map(normDevice), total: arr.length };
  },
  createDevice: async (body) => {
    const res = await http.post(EP.devices, body);
    return normDevice(res?.data || res);
  },
  updateDevice: async (id, body) => {
    const res = await http.put(`${EP.devices}/${id}`, body);
    return normDevice(res?.data || res);
  },
  deleteDevice: async (id) => { await http.del(`${EP.devices}/${id}`); return { ok: true }; },

  // ── Gateways (not in backend) ────────────────────────────────────────────
  getGateways: emptyList,
  createGateway: okStub,
  updateGateway: okStub,
  deleteGateway: okStub,

  // ── Alerts ───────────────────────────────────────────────────────────────
  getAlerts: async (params) => {
    const p = { ...params };
    if (p.status === "Open")         p.status = "active";
    if (p.status === "Acknowledged") p.status = "acknowledged";
    if (p.status === "Resolved")     p.status = "resolved";
    const res = await http.get(EP.alerts, p);
    const arr = unwrap(res);
    return { data: arr.map(normAlert), total: arr.length };
  },
  // Backend only has /resolve, not /acknowledge — map both to resolve
  ackAlert:     async (id) => { await http.patch(`/alerts/${id}/resolve`, {}); return { ok: true }; },
  resolveAlert: async (id) => { await http.patch(EP.alertResolve(id), {}); return { ok: true }; },

  // ── Notifications (not in backend) ───────────────────────────────────────
  getNotifications: async () => ({ notifications: [] }),
  markAllNotificationsRead: okStub,
  markNotificationRead: okStub,

  // ── Alert rules (not in backend) ─────────────────────────────────────────
  getAlertRules: async () => [],
  createAlertRule: okStub,
  updateAlertRule: okStub,
  deleteAlertRule: okStub,

  // ── Work Orders (not in backend) ─────────────────────────────────────────
  getWorkOrders: emptyList,
  createWorkOrder: okStub,
  updateWorkOrder: okStub,
  deleteWorkOrder: okStub,

  // ── Dispatch (not in backend) ────────────────────────────────────────────
  getDispatch: emptyList,
  createDispatch: okStub,
  updateDispatch: okStub,
  deleteDispatch: okStub,

  // ── Inventory (not in backend) ───────────────────────────────────────────
  getInventory: emptyList,
  createInventory: okStub,
  updateInventory: okStub,
  deleteInventory: okStub,

  // ── Produce (not in backend) ─────────────────────────────────────────────
  getProduce: emptyList,
  createProduce: okStub,
  updateProduce: okStub,
  deleteProduce: okStub,

  // ── Reports (not in backend) ─────────────────────────────────────────────
  getReports: emptyList,
  getReportMetrics: async () => ({ monthly: [] }),
  generateReport: okStub,
  scheduleReport: okStub,

  // ── Audit (not in backend) ───────────────────────────────────────────────
  getAudit: emptyList,

  // ── Users ────────────────────────────────────────────────────────────────
  getUsers: async (params) => {
    const res = await http.get(EP.users, params);
    const arr = unwrap(res);
    return { data: arr.map(normUser), total: arr.length };
  },
  inviteUser: async (body) => {
    const res = await http.post(EP.users, body);
    return normUser(res?.data || res);
  },
  updateUser: async (id, body) => {
    const res = await http.put(`${EP.users}/${id}`, body);
    return normUser(res?.data || res);
  },
  deleteUser: async (id) => { await http.del(`${EP.users}/${id}`); return { ok: true }; },

  // ── Roles (not in backend as separate endpoint) ───────────────────────────
  getRoles: async () => ({ roles: [], perms: [], matrix: {} }),
  createRole: okStub,
  updateRole: okStub,
  deleteRole: okStub,

  // ── Telemetry history — uses backend /history/* dashboard endpoints ────────
  getTelemetryHistory: async () => {
    try {
      const [tempRes, humRes] = await Promise.all([
        http.get("/history/temperature"),
        http.get("/history/humidity"),
      ]);
      const tempArr = Array.isArray(tempRes) ? tempRes : [];
      const humArr  = Array.isArray(humRes)  ? humRes  : [];
      const temp = tempArr.map((r) => ({
        t: r.time, frozen: r.a1, chilled: r.a2 ?? r.a1, pharma: r.b1 ?? r.a1,
      }));
      const hum = humArr.map((r) => ({
        t: r.time, frozen: r.val, chilled: r.val,
      }));
      return { temp, hum };
    } catch { return { temp: [], hum: [] }; }
  },

  // ── Password reset ───────────────────────────────────────────────────────
  resetPassword: async (email) => {
    try { await http.post(EP.passwordReset, { email }); } catch {}
    return { ok: true };
  },
};
