import { pad, clamp } from "../utils/format.js";

export const FACILITIES = [
  { id: "SEPL-NORTH", name: "SEPL Cold Storage Admin", city: "Bhubaneswar" },
  { id: "SEPL-WEST", name: "SEPL West Hub", city: "Cuttack" },
  { id: "SEPL-DELTA", name: "SEPL Delta Cold", city: "Paradip" },
];

// Maps each chamber to its facility for filtering
const CHAMBER_FACILITY = {
  "CH-01": "SEPL-NORTH", "CH-02": "SEPL-NORTH", "CH-03": "SEPL-NORTH", "CH-04": "SEPL-NORTH",
  "CH-05": "SEPL-WEST",  "CH-06": "SEPL-WEST",
  "CH-07": "SEPL-DELTA", "CH-08": "SEPL-DELTA",
};

export const CHAMBERS = [
  { id: "CH-01", name: "Chamber A1 - Frozen", zone: "Frozen", setpoint: -22, temp: -21.6, humidity: 88, capacity: 92, status: "Healthy", doors: "Closed", facility_id: "SEPL-NORTH" },
  { id: "CH-02", name: "Chamber A2 - Frozen", zone: "Frozen", setpoint: -22, temp: -19.1, humidity: 90, capacity: 78, status: "Warning", doors: "Closed", facility_id: "SEPL-NORTH" },
  { id: "CH-03", name: "Chamber B1 - Chilled", zone: "Chilled", setpoint: 2, temp: 2.4, humidity: 84, capacity: 64, status: "Healthy", doors: "Open",   facility_id: "SEPL-NORTH" },
  { id: "CH-04", name: "Chamber B2 - Chilled", zone: "Chilled", setpoint: 2, temp: 5.8, humidity: 81, capacity: 55, status: "Critical", doors: "Open",  facility_id: "SEPL-NORTH" },
  { id: "CH-05", name: "Chamber C1 - Dairy",   zone: "Dairy",   setpoint: 4, temp: 4.1, humidity: 79, capacity: 71, status: "Healthy", doors: "Closed", facility_id: "SEPL-WEST"  },
  { id: "CH-06", name: "Chamber C2 - Pharma",  zone: "Pharma",  setpoint: 5, temp: 5.0, humidity: 77, capacity: 48, status: "Healthy", doors: "Closed", facility_id: "SEPL-WEST"  },
  { id: "CH-07", name: "Chamber D1 - Antechamber", zone: "Buffer", setpoint: 8, temp: 9.2, humidity: 72, capacity: 33, status: "Warning", doors: "Closed", facility_id: "SEPL-DELTA" },
  { id: "CH-08", name: "Chamber D2 - Blast Freeze", zone: "Frozen", setpoint: -35, temp: -34.6, humidity: 91, capacity: 88, status: "Healthy", doors: "Closed", facility_id: "SEPL-DELTA" },
];

const DEVICE_TYPES = ["Temp Sensor", "Humidity Sensor", "Door Sensor", "Compressor", "Power Meter"];
export const DEVICES = Array.from({ length: 46 }).map((_, i) => {
  const ch = CHAMBERS[i % CHAMBERS.length];
  const type = DEVICE_TYPES[i % DEVICE_TYPES.length];
  const offline = i % 11 === 0;
  const battery = offline ? 0 : clamp(100 - (i * 7) % 80, 6, 100);
  return {
    id: `DEV-${pad(1000 + i)}`, name: `${type} ${pad(i + 1)}`, type,
    chamber: ch.id, gateway: `GW-${pad(1 + (i % 5))}`,
    status: offline ? "Offline" : battery < 20 ? "Degraded" : "Online",
    battery, rssi: offline ? -110 : -(48 + (i * 3) % 50),
    firmware: `v3.${(i % 4) + 1}.${i % 7}`,
    lastSeen: offline ? "2h 14m ago" : `${(i % 50) + 1}s ago`,
    facility_id: CHAMBER_FACILITY[ch.id],
  };
});

export const GATEWAYS = Array.from({ length: 5 }).map((_, i) => ({
  id: `GW-${pad(i + 1)}`,
  name: `Gateway ${["Alpha", "Bravo", "Charlie", "Delta", "Echo"][i]}`,
  facility: FACILITIES[i % FACILITIES.length].id,
  facility_id: FACILITIES[i % FACILITIES.length].id,
  devices: DEVICES.filter((d) => d.gateway === `GW-${pad(i + 1)}`).length,
  uptime: i === 3 ? "62.0%" : `${(99.2 - i * 0.3).toFixed(1)}%`,
  status: i === 3 ? "Degraded" : "Online",
  ip: `10.40.${i + 1}.10`, fw: `gw-2.${i}.4`,
  lastSync: i === 3 ? "1m 40s ago" : `${i + 2}s ago`,
}));

export const ALERTS_SEED = [
  { id: "ALM-90412", sev: "Critical", chamber: "CH-04", title: "Temperature above setpoint (+3.8C)", status: "Open",     age: "4m",      owner: "Control Room", rule: "TEMP_HIGH",  facility_id: "SEPL-NORTH" },
  { id: "ALM-90408", sev: "High",     chamber: "CH-03", title: "Door open beyond 6 min threshold",   status: "Ack",      age: "12m",     owner: "R. Mishra",    rule: "DOOR_OPEN",  facility_id: "SEPL-NORTH" },
  { id: "ALM-90401", sev: "Medium",   chamber: "CH-07", title: "Humidity drift outside band",         status: "Open",     age: "21m",     owner: "Unassigned",   rule: "HUM_DRIFT",  facility_id: "SEPL-DELTA" },
  { id: "ALM-90388", sev: "High",     chamber: "CH-02", title: "Compressor cycling abnormal",         status: "Ack",      age: "38m",     owner: "Maintenance",  rule: "COMP_CYCLE", facility_id: "SEPL-NORTH" },
  { id: "ALM-90377", sev: "Low",      chamber: "CH-05", title: "Sensor battery low (18%)",            status: "Open",     age: "1h 02m",  owner: "Unassigned",   rule: "BATT_LOW",   facility_id: "SEPL-WEST"  },
  { id: "ALM-90361", sev: "Critical", chamber: "GW-04", title: "Gateway sync lost",                   status: "Open",     age: "1m 40s",  owner: "Control Room", rule: "GW_OFFLINE", facility_id: "SEPL-NORTH" },
  { id: "ALM-90340", sev: "Medium",   chamber: "CH-07", title: "Defrost cycle delayed",               status: "Resolved", age: "2h 11m",  owner: "S. Panda",     rule: "DEFROST",    facility_id: "SEPL-DELTA" },
  { id: "ALM-90318", sev: "Low",      chamber: "CH-01", title: "Power factor below 0.92",             status: "Resolved", age: "3h 04m",  owner: "Maintenance",  rule: "PF_LOW",     facility_id: "SEPL-NORTH" },
];

export const WORK_ORDERS = [
  { id: "WO-2271", title: "Replace condenser fan motor",    asset: "CH-04 Compressor", priority: "Urgent", status: "In Progress", assignee: "Maintenance Team A", due: "Today 17:00", sla: "On track", facility_id: "SEPL-NORTH" },
  { id: "WO-2268", title: "Recalibrate temp probe",          asset: "DEV-1003",         priority: "High",   status: "Open",        assignee: "R. Mishra",           due: "Today 20:00", sla: "At risk",  facility_id: "SEPL-NORTH" },
  { id: "WO-2255", title: "Door gasket inspection",          asset: "CH-03",            priority: "Medium", status: "Open",        assignee: "Unassigned",          due: "Tomorrow",    sla: "On track", facility_id: "SEPL-NORTH" },
  { id: "WO-2249", title: "Gateway GW-04 reboot & firmware", asset: "GW-04",            priority: "Urgent", status: "In Progress", assignee: "S. Panda",            due: "Today 16:00", sla: "Breached", facility_id: "SEPL-NORTH" },
  { id: "WO-2240", title: "Quarterly compressor service",    asset: "CH-08",            priority: "Low",    status: "Scheduled",   assignee: "Maintenance Team B",  due: "12 Jun",      sla: "On track", facility_id: "SEPL-DELTA" },
  { id: "WO-2231", title: "Replace UPS battery bank",        asset: "Power Room",       priority: "High",   status: "Completed",   assignee: "Maintenance Team A",  due: "Yesterday",   sla: "Met",      facility_id: "SEPL-NORTH" },
];

export const DISPATCH = [
  { id: "DSP-5521", vehicle: "OD-02-AK-4412", reefer: "-18C", driver: "B. Sahoo", dest: "Reliance DC, Cuttack",  load: "Frozen / 12 pallets", eta: "14:40", status: "In Transit", facility_id: "SEPL-NORTH" },
  { id: "DSP-5519", vehicle: "OD-05-CB-9087", reefer: "+2C",  driver: "M. Khan",   dest: "More Retail, BBSR",    load: "Dairy / 8 pallets",   eta: "13:10", status: "Loading",    facility_id: "SEPL-WEST"  },
  { id: "DSP-5515", vehicle: "OD-02-AL-1190", reefer: "-22C", driver: "P. Das",    dest: "Cold Hub, Paradip",    load: "Seafood / 16 pallets", eta: "16:25", status: "In Transit", facility_id: "SEPL-DELTA" },
  { id: "DSP-5510", vehicle: "OD-33-BX-7765", reefer: "+5C",  driver: "T. Nayak",  dest: "Apollo Pharma, BBSR",  load: "Pharma / 4 pallets",   eta: "12:05", status: "Delivered",  facility_id: "SEPL-NORTH" },
  { id: "DSP-5506", vehicle: "OD-02-AK-3321", reefer: "+4C",  driver: "K. Rout",   dest: "Vishal Mega, Cuttack", load: "Dairy / 10 pallets",   eta: "-",     status: "Scheduled",  facility_id: "SEPL-WEST"  },
];

export const INVENTORY = Array.from({ length: 28 }).map((_, i) => {
  const ch = CHAMBERS[i % CHAMBERS.length];
  const cats = ["Seafood", "Poultry", "Dairy", "Pharma", "Vegetables", "Ice Cream", "Meat"];
  const cat = cats[i % cats.length];
  const exp = (i % 9) + 1;
  return {
    id: `SKU-${pad(40010 + i)}`, product: `${cat} Lot ${pad(i + 1)}`, category: cat,
    chamber: ch.id, pallets: ((i * 3) % 18) + 2, weight: `${(((i * 137) % 900) + 120)} kg`,
    received: `${(i % 27) + 1} May`,
    expiry: exp <= 2 ? `Expiring (${exp}d)` : `${exp + 4} Jun`,
    status: exp <= 2 ? "Action Needed" : "In Stock",
    facility_id: CHAMBER_FACILITY[ch.id],
  };
});

export const USERS = [
  { id: "U-001", name: "SEPL Cold Storage", email: "anil.p@sepl.in", role: "Owner", facility: "All", status: "Active", last: "Online now" },
  { id: "U-002", name: "Rakesh Mishra", email: "r.mishra@sepl.in", role: "Facility Manager", facility: "SEPL-NORTH", status: "Active", last: "4m ago" },
  { id: "U-003", name: "Sweta Panda", email: "s.panda@sepl.in", role: "Maintenance Lead", facility: "SEPL-NORTH", status: "Active", last: "12m ago" },
  { id: "U-004", name: "Control Room 01", email: "cr01@sepl.in", role: "Operator", facility: "SEPL-NORTH", status: "Active", last: "Online now" },
  { id: "U-005", name: "Bikash Sahoo", email: "b.sahoo@sepl.in", role: "Dispatch", facility: "SEPL-WEST", status: "Active", last: "1h ago" },
  { id: "U-006", name: "Manoj Khan", email: "m.khan@sepl.in", role: "Operator", facility: "SEPL-WEST", status: "Suspended", last: "3d ago" },
  { id: "U-007", name: "Priyanka Das", email: "p.das@sepl.in", role: "Warehouse Manager", facility: "SEPL-DELTA", status: "Invited", last: "-" },
];

export const AUDIT_SEED = [
  { id: "AUD-77310", ts: "12:41:08", actor: "Control Room 01", action: "ACK alert ALM-90408", target: "CH-03", ip: "10.40.1.55" },
  { id: "AUD-77305", ts: "12:39:51", actor: "R. Mishra", action: "Created WO-2268", target: "DEV-1003", ip: "10.40.1.22" },
  { id: "AUD-77298", ts: "12:36:14", actor: "System", action: "Auto-raised ALM-90412", target: "CH-04", ip: "-" },
  { id: "AUD-77290", ts: "12:30:02", actor: "SEPL Cold Storage", action: "Updated setpoint -22C", target: "CH-02", ip: "103.21.9.4" },
  { id: "AUD-77281", ts: "12:22:40", actor: "S. Panda", action: "Closed WO-2231", target: "Power Room", ip: "10.40.1.31" },
];

export const ROLES = [
  { id: "R-OWN", name: "Owner", users: 1, scope: "Global", desc: "Full access incl. billing, multi-facility analytics" },
  { id: "R-FM", name: "Facility Manager", users: 1, scope: "Facility", desc: "Manage chambers, devices, work orders, users" },
  { id: "R-OPS", name: "Operator", users: 2, scope: "Facility", desc: "Monitoring, alert ack, activity logging" },
  { id: "R-MNT", name: "Maintenance Lead", users: 1, scope: "Facility", desc: "Work orders, device service, gateways" },
  { id: "R-DSP", name: "Dispatch", users: 1, scope: "Facility", desc: "Dispatch operations, reefer tracking" },
  { id: "R-WH", name: "Warehouse Manager", users: 1, scope: "Facility", desc: "Inventory, chamber utilization" },
];

export const PERMS = ["Dashboard", "Produce", "Chambers", "Devices", "Gateways", "Alerts", "Work Orders", "Dispatch", "Inventory", "Reports", "Audit", "Users", "Settings"];
export const PERM_MATRIX = {
  Owner: PERMS,
  "Facility Manager": PERMS,
  Operator: ["Dashboard", "Produce", "Chambers", "Devices", "Gateways", "Alerts"],
  "Maintenance Lead": ["Dashboard", "Produce", "Devices", "Gateways", "Work Orders", "Alerts"],
  Dispatch: ["Dashboard", "Dispatch", "Inventory"],
  "Warehouse Manager": ["Dashboard", "Produce", "Inventory", "Chambers", "Reports"],
};

export const REPORTS = [
  { id: "RPT-01", name: "Cold-chain compliance - monthly", type: "Compliance",  schedule: "Monthly - 1st", last: "01 Jun", status: "Ready"      },
  { id: "RPT-02", name: "Temperature excursion summary",   type: "Operations",  schedule: "Weekly - Mon",  last: "02 Jun", status: "Ready"      },
  { id: "RPT-03", name: "Gateway & device uptime",         type: "Reliability", schedule: "Weekly - Mon",  last: "02 Jun", status: "Ready"      },
  { id: "RPT-04", name: "Energy & compressor runtime",     type: "Energy",      schedule: "Monthly - 1st", last: "01 Jun", status: "Ready"      },
  { id: "RPT-05", name: "Dispatch & cold-chain handoff",   type: "Logistics",   schedule: "Daily",         last: "03 Jun", status: "Generating" },
];

export const MONTHLY = Array.from({ length: 12 }).map((_, i) => ({
  m: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i],
  excursions: Math.round(4 + Math.sin(i) * 3 + (i % 3)),
  uptime: +(98 + Math.cos(i) * 1.2).toFixed(1),
}));

export const NOTIFICATIONS = [
  { id: "n1", icon: "alert", tone: "red", title: "Critical: CH-04 temperature excursion", sub: "Escalated to Control Room - 4m ago", unread: true },
  { id: "n2", icon: "truck", tone: "blue", title: "Dispatch DSP-5521 departed dock 3", sub: "Reefer at -18C - 9m ago", unread: true },
  { id: "n3", icon: "wrench", tone: "amber", title: "Work order WO-2268 assigned to you", sub: "Recalibrate temp probe - 14m ago", unread: true },
  { id: "n4", icon: "check", tone: "emerald", title: "WO-2231 marked completed", sub: "UPS battery bank replaced - 1h ago", unread: false },
  { id: "n5", icon: "power", tone: "red", title: "Gateway GW-04 sync lost", sub: "9 devices affected - 1h ago", unread: false },
  { id: "n6", icon: "box", tone: "slate", title: "Chamber CH-02 utilization above 75%", sub: "Capacity planning advisory - 2h ago", unread: false },
];

export const FEED_SEED = [
  { id: 1, tone: "red", text: "ALM-90412 raised - CH-04 temperature +3.8C over setpoint", who: "System", time: "now" },
  { id: 2, tone: "blue", text: "Dispatch DSP-5521 departed - reefer at -18C", who: "Dispatch", time: "just now" },
  { id: 3, tone: "emerald", text: "WO-2231 completed - UPS battery replaced", who: "Maintenance A", time: "1m ago" },
  { id: 4, tone: "amber", text: "CH-03 door opened - monitoring", who: "Control Room", time: "2m ago" },
  { id: 5, tone: "slate", text: "Sync OK - 42/46 devices reporting", who: "GW-01", time: "2m ago" },
];

export const ALERT_RULES = [
  { id: "RULE-01", code: "TEMP_HIGH",  name: "Temperature Above Setpoint", condition: "temp > setpoint + 2°C",      severity: "Critical", enabled: true  },
  { id: "RULE-02", code: "DOOR_OPEN",  name: "Door Open Too Long",          condition: "door_open > 6 min",          severity: "High",     enabled: true  },
  { id: "RULE-03", code: "HUM_DRIFT",  name: "Humidity Out of Band",        condition: "humidity < 70% or > 92%",    severity: "Medium",   enabled: true  },
  { id: "RULE-04", code: "COMP_CYCLE", name: "Compressor Abnormal Cycle",   condition: "cycle_per_hr > 8",           severity: "High",     enabled: true  },
  { id: "RULE-05", code: "BATT_LOW",   name: "Sensor Battery Low",          condition: "battery < 20%",              severity: "Low",      enabled: true  },
  { id: "RULE-06", code: "GW_OFFLINE", name: "Gateway Sync Lost",           condition: "last_sync > 5 min",          severity: "Critical", enabled: true  },
  { id: "RULE-07", code: "DEFROST",    name: "Defrost Cycle Delayed",       condition: "last_defrost > 12 h",        severity: "Medium",   enabled: false },
  { id: "RULE-08", code: "PF_LOW",     name: "Power Factor Below Threshold", condition: "power_factor < 0.92",       severity: "Low",      enabled: true  },
];

export const PRODUCE = [
  { id: "PRD-001", name: "Alphonso Mango",      category: "Fruit",     variety: "Alphonso",     chamber: "CH-03", tempRequired: "8-12°C",  currentTemp: 2.4,  pallets: 18, weight: "2700 kg", received: "09 Jun", expiry: "18 Jun", quality: "Fresh",        origin: "Ratnagiri",    facility_id: "SEPL-NORTH" },
  { id: "PRD-002", name: "Banana",               category: "Fruit",     variety: "Cavendish",    chamber: "CH-03", tempRequired: "13-15°C", currentTemp: 2.4,  pallets: 12, weight: "1800 kg", received: "08 Jun", expiry: "14 Jun", quality: "Good",         origin: "Jalgaon",      facility_id: "SEPL-NORTH" },
  { id: "PRD-003", name: "Apple",                category: "Fruit",     variety: "Shimla Red",   chamber: "CH-05", tempRequired: "1-4°C",   currentTemp: 4.1,  pallets: 24, weight: "3600 kg", received: "07 Jun", expiry: "07 Aug", quality: "Fresh",        origin: "Shimla",       facility_id: "SEPL-WEST"  },
  { id: "PRD-004", name: "Grapes",               category: "Fruit",     variety: "Thompson",     chamber: "CH-05", tempRequired: "0-2°C",   currentTemp: 4.1,  pallets: 9,  weight: "1350 kg", received: "10 Jun", expiry: "24 Jun", quality: "Good",         origin: "Nashik",       facility_id: "SEPL-WEST"  },
  { id: "PRD-005", name: "Pomegranate",           category: "Fruit",     variety: "Bhagwa",       chamber: "CH-06", tempRequired: "5-8°C",   currentTemp: 5.0,  pallets: 15, weight: "2250 kg", received: "05 Jun", expiry: "25 Jun", quality: "Fresh",        origin: "Solapur",      facility_id: "SEPL-WEST"  },
  { id: "PRD-006", name: "Strawberry",            category: "Fruit",     variety: "Sweet Charlie",chamber: "CH-03", tempRequired: "0-2°C",   currentTemp: 2.4,  pallets: 6,  weight: "600 kg",  received: "10 Jun", expiry: "13 Jun", quality: "Expiring Soon",origin: "Mahabaleshwar", facility_id: "SEPL-NORTH" },
  { id: "PRD-007", name: "Watermelon",            category: "Fruit",     variety: "Kiran",        chamber: "CH-07", tempRequired: "10-15°C", currentTemp: 9.2,  pallets: 30, weight: "9000 kg", received: "06 Jun", expiry: "20 Jun", quality: "Good",         origin: "Kolhapur",     facility_id: "SEPL-DELTA" },
  { id: "PRD-008", name: "Papaya",                category: "Fruit",     variety: "Red Lady",     chamber: "CH-04", tempRequired: "10-13°C", currentTemp: 5.8,  pallets: 8,  weight: "1200 kg", received: "08 Jun", expiry: "15 Jun", quality: "Fair",         origin: "Coimbatore",   facility_id: "SEPL-NORTH" },
  { id: "PRD-009", name: "Potato",                category: "Vegetable", variety: "Kufri Jyoti",  chamber: "CH-07", tempRequired: "4-10°C",  currentTemp: 9.2,  pallets: 45, weight: "11250 kg",received: "01 Jun", expiry: "01 Sep", quality: "Good",         origin: "Agra",         facility_id: "SEPL-DELTA" },
  { id: "PRD-010", name: "Onion",                 category: "Vegetable", variety: "Red Nashik",   chamber: "CH-07", tempRequired: "0-4°C",   currentTemp: 9.2,  pallets: 36, weight: "9000 kg", received: "03 Jun", expiry: "03 Aug", quality: "Good",         origin: "Nashik",       facility_id: "SEPL-DELTA" },
  { id: "PRD-011", name: "Tomato",                category: "Vegetable", variety: "Hybrid F1",    chamber: "CH-03", tempRequired: "8-12°C",  currentTemp: 2.4,  pallets: 14, weight: "2100 kg", received: "09 Jun", expiry: "16 Jun", quality: "Fresh",        origin: "Pune",         facility_id: "SEPL-NORTH" },
  { id: "PRD-012", name: "Capsicum",              category: "Vegetable", variety: "California",   chamber: "CH-03", tempRequired: "7-10°C",  currentTemp: 2.4,  pallets: 10, weight: "1500 kg", received: "08 Jun", expiry: "17 Jun", quality: "Good",         origin: "Ooty",         facility_id: "SEPL-NORTH" },
  { id: "PRD-013", name: "Carrot",                category: "Vegetable", variety: "Nantes",       chamber: "CH-05", tempRequired: "0-4°C",   currentTemp: 4.1,  pallets: 20, weight: "3000 kg", received: "04 Jun", expiry: "04 Jul", quality: "Good",         origin: "Ooty",         facility_id: "SEPL-WEST"  },
  { id: "PRD-014", name: "Cauliflower",            category: "Vegetable", variety: "Snowball",     chamber: "CH-05", tempRequired: "0-4°C",   currentTemp: 4.1,  pallets: 12, weight: "1800 kg", received: "07 Jun", expiry: "14 Jun", quality: "Fresh",        origin: "Himachal",     facility_id: "SEPL-WEST"  },
  { id: "PRD-015", name: "Green Peas",             category: "Vegetable", variety: "Arkel",        chamber: "CH-08", tempRequired: "-18°C",   currentTemp: -34.6,pallets: 22, weight: "3300 kg", received: "01 May", expiry: "01 Nov", quality: "Fresh",        origin: "Punjab",       facility_id: "SEPL-DELTA" },
  { id: "PRD-016", name: "Spinach",                category: "Vegetable", variety: "Palak",        chamber: "CH-03", tempRequired: "0-2°C",   currentTemp: 2.4,  pallets: 5,  weight: "500 kg",  received: "10 Jun", expiry: "13 Jun", quality: "Expiring Soon",origin: "Delhi",        facility_id: "SEPL-NORTH" },
  { id: "PRD-017", name: "Broccoli",               category: "Vegetable", variety: "Green Magic",  chamber: "CH-06", tempRequired: "0-4°C",   currentTemp: 5.0,  pallets: 8,  weight: "1200 kg", received: "09 Jun", expiry: "16 Jun", quality: "Good",         origin: "Ooty",         facility_id: "SEPL-WEST"  },
  { id: "PRD-018", name: "Bitter Gourd",           category: "Vegetable", variety: "Priya",        chamber: "CH-07", tempRequired: "10-12°C", currentTemp: 9.2,  pallets: 7,  weight: "1050 kg", received: "08 Jun", expiry: "15 Jun", quality: "Good",         origin: "Andhra",       facility_id: "SEPL-DELTA" },
];

// Seed a time series for temperature / humidity charts.
export const seedSeries = (n, base, spread) => {
  const out = [];
  let a = base, b = base + spread, c = base - spread * 0.6;
  for (let i = n; i > 0; i--) {
    a += (Math.random() - 0.5) * spread * 0.4;
    b += (Math.random() - 0.5) * spread * 0.5;
    c += (Math.random() - 0.5) * spread * 0.4;
    out.push({
      t: `${pad(((new Date().getHours() - Math.floor(i / 4)) + 24) % 24)}:${pad((i * 15) % 60)}`,
      frozen: +a.toFixed(2), chilled: +b.toFixed(2), pharma: +c.toFixed(2),
    });
  }
  return out;
};
