// In-browser mock backend. Used only when VITE_USE_MOCK=true.
// Mirrors the exact contract of realApi so the UI behaves identically.
import {
  FACILITIES, CHAMBERS, DEVICES, GATEWAYS, ALERTS_SEED, WORK_ORDERS, DISPATCH,
  INVENTORY, USERS, AUDIT_SEED, ROLES, PERMS, PERM_MATRIX, REPORTS, MONTHLY,
  NOTIFICATIONS, ALERT_RULES, PRODUCE, seedSeries,
} from "./mockData.js";
import { AUTH } from "../utils/tokens.js";

const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const ALL_PERMS = ["dashboard","produce","chambers","devices","gateways","alerts","notifications","work_orders","dispatch","inventory","reports","audit","users","roles","settings"];

// mutable in-memory copies so create actions are visible during the session
let devices = [...DEVICES];
let chambers = [...CHAMBERS];
let workOrders = [...WORK_ORDERS];
let users = [...USERS];
let alerts = [...ALERTS_SEED];
let notifications = [...NOTIFICATIONS];
let dispatch = [...DISPATCH];
let inventory = [...INVENTORY];
let roles = [...ROLES];
let alertRules = [...ALERT_RULES];
let gateways = [...GATEWAYS];
let reports  = [...REPORTS];
let produce  = [...PRODUCE];

const list = (arr, params = {}) => {
  let r = arr;
  if (params.facility_id) r = r.filter((x) => !x.facility_id || x.facility_id === params.facility_id);
  if (params.search) {
    const t = String(params.search).toLowerCase();
    r = r.filter((x) => Object.values(x).some((v) => String(v).toLowerCase().includes(t)));
  }
  const total = r.length;
  if (params.page && params.pageSize) {
    const off = (Number(params.page) - 1) * Number(params.pageSize);
    r = r.slice(off, off + Number(params.pageSize));
  }
  return { data: r, total };
};
const updateById = (arr, id, body) => arr.map((row) => (row.id === id ? { ...row, ...body, id } : row));
const deleteById = (arr, id) => arr.filter((row) => row.id !== id);
const findById = (arr, id) => arr.find((row) => row.id === id) || { id, ok: true };

export const api = {
  async login(email, password) {
    await delay(500);
    if (email.trim().toLowerCase() === AUTH.email && password === AUTH.password) {
      return {
        token: "mock-jwt-token",
        user: { id: "U-001", name: "SEPL Cold Storage", email: AUTH.email, role: "Owner", permissions: ALL_PERMS },
      };
    }
    throw new Error("Invalid credentials. Check your email and password.");
  },
  async me() { await delay(100); return { id: "U-001", name: "SEPL Cold Storage", email: AUTH.email, role: "Owner", permissions: ALL_PERMS }; },

  async getFacilities() { await delay(150); return FACILITIES; },
  async getChambers(p) { await delay(200); return list(chambers, p); },
  async getDevices(p) { await delay(300); return list(devices, p); },
  async getGateways(p) { await delay(200); return list(gateways, p); },
  async createGateway(body) { await delay(300); const row = { id: `GW-${String(gateways.length + 1).padStart(2,"0")}`, devices: 0, uptime: "100.0%", status: "Online", lastSync: "now", ...body }; gateways = [row, ...gateways]; return row; },
  async updateGateway(id, body) { await delay(200); gateways = updateById(gateways, id, body); return findById(gateways, id); },
  async deleteGateway(id) { await delay(200); gateways = deleteById(gateways, id); return { ok: true }; },
  async getAlerts(p) { await delay(200); return list(alerts, p); },
  async getNotifications() { await delay(150); return { notifications }; },
  async getWorkOrders(p) { await delay(200); return list(workOrders, p); },
  async getDispatch(p) { await delay(200); return list(dispatch, p); },
  async getInventory(p) { await delay(250); return list(inventory, p); },
  async getReports(p) { await delay(150); return list(reports, p); },
  async generateReport(id) { await delay(800); reports = reports.map((r) => r.id === id ? { ...r, status: "Ready", last: new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short"}) } : r); return { ok: true }; },
  async scheduleReport(body) { await delay(400); const row = { id: `RPT-${String(reports.length + 1).padStart(2,"0")}`, status: "Scheduled", last: "-", ...body }; reports = [...reports, row]; return row; },
  async getReportMetrics() { await delay(150); return { monthly: MONTHLY }; },
  async getAudit(p) { await delay(200); return list(AUDIT_SEED, p); },
  async getUsers(p) { await delay(200); return list(users, p); },
  async getRoles() { await delay(120); return { roles, perms: PERMS, matrix: PERM_MATRIX }; },
  async getTelemetryHistory(p) {
    await delay(150);
    const n = p?.period === "weekly" ? 168 : p?.period === "monthly" ? 720 : 48;
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
    const tempSeed = seedSeries(n, -21, 1.4);
    const humSeed = seedSeries(n, 86, 3).map((pt) => ({
      ...pt, frozen: +clamp(pt.frozen + 108, 70, 96).toFixed(1), chilled: +clamp(pt.chilled + 104, 70, 96).toFixed(1),
    }));
    return { temp: tempSeed, hum: humSeed };
  },

  async createChamber(body) { await delay(300); const row = { id: `CH-${10 + chambers.length}`, zone: "Frozen", setpoint: -20, temp: -20, humidity: 85, capacity: 0, status: "Healthy", doors: "Closed", ...body }; chambers = [row, ...chambers]; return row; },
  async createDevice(body) { await delay(300); const row = { id: `DEV-${1100 + devices.length}`, type: "Temp Sensor", gateway: "GW-01", status: "Online", battery: 100, rssi: -55, firmware: "v3.1.0", lastSeen: "now", ...body }; devices = [row, ...devices]; return row; },
  async createWorkOrder(body) { await delay(300); const row = { id: `WO-${2300 + workOrders.length}`, priority: "Medium", status: "Open", assignee: "Unassigned", due: "TBD", sla: "On track", ...body }; workOrders = [row, ...workOrders]; return row; },

  async createDispatch(body) { await delay(300); const row = { id: `DSP-${5600 + dispatch.length}`, reefer: "-18C", driver: "Unassigned", load: "TBD", eta: "-", status: "Scheduled", ...body }; dispatch = [row, ...dispatch]; return row; },
  async createInventory(body) { await delay(300); const row = { id: `SKU-${40100 + inventory.length}`, category: "General", pallets: 0, weight: "0 kg", received: "Today", expiry: "-", status: "In Stock", ...body }; inventory = [row, ...inventory]; return row; },
  async getProduce(p) { await delay(200); return list(produce, p); },
  async createProduce(body) { await delay(300); const row = { id: `PRD-${String(produce.length + 1).padStart(3,"0")}`, category: "Fruit", tempRequired: "8-12°C", currentTemp: 4.0, pallets: 1, weight: "150 kg", received: new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short"}), expiry: "-", quality: "Fresh", origin: "India", facility_id: "SEPL-NORTH", ...body }; produce = [row, ...produce]; return row; },
  async createRole(body) { await delay(300); const row = { id: `R-${roles.length + 1}`, users: 0, scope: "Facility", desc: "", ...body }; roles = [row, ...roles]; return row; },  async inviteUser(body) { await delay(300); const row = { id: `U-${100 + users.length}`, facility: "SEPL-NORTH", status: "Invited", last: "-", ...body }; users = [row, ...users]; return row; },
  async updateChamber(id, body) { await delay(200); chambers = updateById(chambers, id, body); return findById(chambers, id); },
  async deleteChamber(id) { await delay(200); chambers = deleteById(chambers, id); return { ok: true }; },
  async updateDevice(id, body) { await delay(200); devices = updateById(devices, id, body); return findById(devices, id); },
  async deleteDevice(id) { await delay(200); devices = deleteById(devices, id); return { ok: true }; },
  async updateWorkOrder(id, body) { await delay(200); workOrders = updateById(workOrders, id, body); return findById(workOrders, id); },
  async deleteWorkOrder(id) { await delay(200); workOrders = deleteById(workOrders, id); return { ok: true }; },
  async updateDispatch(id, body) { await delay(200); dispatch = updateById(dispatch, id, body); return findById(dispatch, id); },
  async deleteDispatch(id) { await delay(200); dispatch = deleteById(dispatch, id); return { ok: true }; },
  async updateInventory(id, body) { await delay(200); inventory = updateById(inventory, id, body); return findById(inventory, id); },
  async deleteInventory(id) { await delay(200); inventory = deleteById(inventory, id); return { ok: true }; },
  async updateProduce(id, body) { await delay(200); produce = updateById(produce, id, body); return findById(produce, id); },
  async deleteProduce(id) { await delay(200); produce = deleteById(produce, id); return { ok: true }; },
  async updateUser(id, body) { await delay(200); users = updateById(users, id, body); return findById(users, id); },
  async deleteUser(id) { await delay(200); users = deleteById(users, id); return { ok: true }; },
  async updateRole(id, body) { await delay(200); roles = updateById(roles, id, body); return findById(roles, id); },
  async deleteRole(id) { await delay(200); roles = deleteById(roles, id); return { ok: true }; },
  async ackAlert(id) { await delay(150); alerts = alerts.map((a) => (a.id === id ? { ...a, status: "Ack" } : a)); return { ok: true }; },
  async resolveAlert(id) { await delay(150); alerts = alerts.map((a) => (a.id === id ? { ...a, status: "Resolved" } : a)); return { ok: true }; },
  async markAllNotificationsRead() { await delay(120); notifications = notifications.map((n) => ({ ...n, unread: false })); return { ok: true }; },
  async markNotificationRead(id) { await delay(80); notifications = notifications.map((n) => (n.id === id ? { ...n, unread: false } : n)); return { ok: true }; },

  // alert rules
  async getAlertRules() { await delay(150); return { data: alertRules, total: alertRules.length }; },
  async createAlertRule(body) { await delay(300); const row = { id: `RULE-${String(alertRules.length + 1).padStart(2, "0")}`, enabled: true, ...body }; alertRules = [row, ...alertRules]; return row; },
  async updateAlertRule(id, body) { await delay(200); alertRules = alertRules.map((r) => (r.id === id ? { ...r, ...body, id } : r)); return alertRules.find((r) => r.id === id); },
  async deleteAlertRule(id) { await delay(200); alertRules = alertRules.filter((r) => r.id !== id); return { ok: true }; },

  // password reset — always succeeds for any email (security best-practice: never leak whether account exists)
  async resetPassword() { await delay(600); return { ok: true }; },
};
