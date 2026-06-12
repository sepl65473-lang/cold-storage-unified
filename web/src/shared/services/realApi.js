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

  // ── Facilities ───────────────────────────────────────────────────────────
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
  createChamber: async (body) => {
    const res = await http.post("/devices/", {
      name: body.name,
      location_label: body.location_label || body.name,
    });
    return res;
  },
  updateChamber: async (id, body) => {
    const res = await http.patch(`/devices/${id}`, {
      name: body.name,
      location_label: body.location_label,
      is_active: body.is_active,
    });
    return res;
  },
  deleteChamber: async (id) => {
    await http.patch(`/devices/${id}`, { is_active: false });
    return { ok: true };
  },

  // ── Devices ──────────────────────────────────────────────────────────────
  getDevices: async (params) => {
    const res = await http.get(EP.devices, params);
    const arr = unwrap(res);
    return { data: arr.map(normDevice), total: arr.length };
  },
  createDevice: async (body) => {
    const res = await http.post(EP.devices, {
      name: body.name,
      location_label: body.chamber || body.location_label || "",
    });
    return normDevice(res?.data || res);
  },
  updateDevice: async (id, body) => {
    const res = await http.patch(`/devices/${id}`, {
      name: body.name,
      location_label: body.chamber || body.location_label || "",
      is_active: body.is_active,
    });
    return normDevice(res?.data || res);
  },
  deleteDevice: async (id) => { await http.del(`/devices/${id}`); return { ok: true }; },

  // ── Gateways ─────────────────────────────────────────────────────────────
  getGateways: async (params) => {
    const res = await http.get(EP.gateways, params);
    const arr = unwrap(res);
    return { data: arr, total: arr.length };
  },
  createGateway: async (body) => {
    const res = await http.post(EP.gateways, body);
    return res?.data || res;
  },
  updateGateway: async (id, body) => {
    const res = await http.put(`${EP.gateways}${id}`, body);
    return res?.data || res;
  },
  deleteGateway: async (id) => {
    await http.del(`${EP.gateways}${id}`);
    return { ok: true };
  },

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

  // ── Notifications ────────────────────────────────────────────────────────
  getNotifications: async () => {
    try {
      const res = await http.get(EP.notifications);
      return res || { notifications: [] };
    } catch { return { notifications: [] }; }
  },
  markAllNotificationsRead: async () => {
    try { await http.post(EP.notificationsReadAll, {}); } catch {}
    return { ok: true };
  },
  markNotificationRead: async (id) => {
    try { await http.patch(EP.notificationRead(id), {}); } catch {}
    return { ok: true };
  },

  // ── Alert Rules ──────────────────────────────────────────────────────────
  getAlertRules: async () => {
    try {
      const res = await http.get(EP.alertRules);
      return Array.isArray(res) ? res : (res?.data || []);
    } catch { return []; }
  },
  createAlertRule: async (body) => {
    const res = await http.post(EP.alertRules, body);
    return res?.data || res;
  },
  updateAlertRule: async (id, body) => {
    const res = await http.put(`/alert-rules/${id}`, body);
    return res?.data || res;
  },
  deleteAlertRule: async (id) => {
    await http.del(`/alert-rules/${id}`);
    return { ok: true };
  },

  // ── Work Orders ──────────────────────────────────────────────────────────
  getWorkOrders: async (params) => {
    const res = await http.get(EP.workOrders, params);
    const arr = unwrap(res);
    return { data: arr, total: arr.length };
  },
  createWorkOrder: async (body) => {
    const res = await http.post(EP.workOrders, body);
    return res?.data || res;
  },
  updateWorkOrder: async (id, body) => {
    const realId = body._id || id;
    const res = await http.put(`/work-orders/${realId}`, body);
    return res?.data || res;
  },
  deleteWorkOrder: async (id) => {
    await http.del(`/work-orders/${id}`);
    return { ok: true };
  },

  // ── Dispatch ─────────────────────────────────────────────────────────────
  getDispatch: async (params) => {
    const res = await http.get(EP.dispatch, params);
    const arr = unwrap(res);
    return { data: arr, total: arr.length };
  },
  createDispatch: async (body) => {
    const res = await http.post(EP.dispatch, body);
    return res?.data || res;
  },
  updateDispatch: async (id, body) => {
    const realId = body._id || id;
    const res = await http.put(`/dispatch/${realId}`, body);
    return res?.data || res;
  },
  deleteDispatch: async (id) => {
    await http.del(`/dispatch/${id}`);
    return { ok: true };
  },

  // ── Inventory ────────────────────────────────────────────────────────────
  getInventory: async (params) => {
    const res = await http.get(EP.inventory, params);
    const arr = unwrap(res);
    return { data: arr, total: arr.length };
  },
  createInventory: async (body) => {
    const res = await http.post(EP.inventory, body);
    return res?.data || res;
  },
  updateInventory: async (id, body) => {
    const realId = body._id || id;
    const res = await http.put(`/inventory/${realId}`, body);
    return res?.data || res;
  },
  deleteInventory: async (id) => {
    await http.del(`/inventory/${id}`);
    return { ok: true };
  },

  // ── Produce ──────────────────────────────────────────────────────────────
  getProduce: async (params) => {
    const res = await http.get(EP.produce, params);
    const arr = unwrap(res);
    return { data: arr, total: arr.length };
  },
  createProduce: async (body) => {
    // Map camelCase frontend fields to snake_case backend fields
    const payload = { ...body };
    if (body.tempRequired) { payload.temp_required = body.tempRequired; delete payload.tempRequired; }
    if (body.currentTemp !== undefined) { payload.current_temp = body.currentTemp; delete payload.currentTemp; }
    const res = await http.post(EP.produce, payload);
    return res?.data || res;
  },
  updateProduce: async (id, body) => {
    const realId = body._id || id;
    const payload = { ...body };
    if (body.tempRequired) { payload.temp_required = body.tempRequired; delete payload.tempRequired; }
    const res = await http.put(`/produce/${realId}`, payload);
    return res?.data || res;
  },
  deleteProduce: async (id) => {
    await http.del(`/produce/${id}`);
    return { ok: true };
  },

  // ── Reports ──────────────────────────────────────────────────────────────
  getReports: async (params) => {
    try {
      const res = await http.get(EP.reports, params);
      const arr = unwrap(res);
      return { data: arr, total: arr.length };
    } catch { return { data: [], total: 0 }; }
  },
  getReportMetrics: async () => {
    try {
      const res = await http.get(EP.reportsMetrics);
      return res || { monthly: [] };
    } catch { return { monthly: [] }; }
  },
  generateReport: async (id) => {
    try {
      await http.get(EP.reportGenerate(id));
    } catch {}
    return { ok: true };
  },
  scheduleReport: async (body) => {
    try { await http.post(EP.reportsSchedule, body); } catch {}
    return { ok: true };
  },

  // ── Audit ────────────────────────────────────────────────────────────────
  getAudit: async (params) => {
    try {
      const res = await http.get(EP.audit, params);
      const arr = unwrap(res);
      return { data: arr, total: arr.length };
    } catch { return { data: [], total: 0 }; }
  },

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
    const res = await http.put(`/admin/users/${id}`, body);
    return normUser(res?.data || res);
  },
  deleteUser: async (id) => { await http.del(`/admin/users/${id}`); return { ok: true }; },

  // ── Roles ────────────────────────────────────────────────────────────────
  getRoles: async () => {
    try {
      const res = await http.get(EP.roles);
      return res || { roles: [], perms: [], matrix: {} };
    } catch { return { roles: [], perms: [], matrix: {} }; }
  },
  createRole: async () => ({ ok: true }),
  updateRole: async () => ({ ok: true }),
  deleteRole: async () => ({ ok: true }),

  // ── Dashboard stats — avgTemp, avgHumidity, activeChambers, activeAlerts ───
  getStats: async () => {
    try {
      const res = await http.get("/stats");
      return res || {};
    } catch { return {}; }
  },

  // ── Telemetry history — backend returns { time, temp } and { time, val } ───
  getTelemetryHistory: async () => {
    try {
      const [tempRes, humRes] = await Promise.all([
        http.get("/history/temperature"),
        http.get("/history/humidity"),
      ]);
      const tempArr = Array.isArray(tempRes) ? tempRes : [];
      const humArr  = Array.isArray(humRes)  ? humRes  : [];
      const temp = tempArr.map((r) => ({
        t: r.time, frozen: r.temp ?? null, chilled: r.temp ?? null, pharma: r.temp ?? null,
      }));
      const hum = humArr.map((r) => ({
        t: r.time, frozen: r.val ?? null, chilled: r.val ?? null,
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
