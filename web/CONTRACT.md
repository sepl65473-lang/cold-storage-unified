# API Contract - SEPL ColdChain Frontend <-> Backend

The frontend expects these endpoints. Base URL = `VITE_API_BASE_URL`.
Auth: every request after login sends `Authorization: Bearer <token>`.
List endpoints return `{ "data": [...], "total": <number> }`.
A `401` anywhere logs the user out on the frontend.

## Auth
### POST /auth/login
Request: `{ "email": "string", "password": "string" }`
Response: `{ "token": "jwt", "user": { "id","name","email","role","permissions": ["dashboard","monitoring",...] } }`

`permissions` keys: dashboard, monitoring, chambers, devices, gateways, alerts,
notifications, work_orders, dispatch, inventory, reports, audit, users, roles, settings.

### GET /auth/me  -> the same `user` object.

## Reads (all support optional `?search=&page=&pageSize=&sort=&facilityId=`)
- GET /facilities -> `[{ id, name, city }]`
- GET /chambers -> data: `{ id, name, zone, setpoint, temp, humidity, capacity, status, doors }`
- GET /devices -> data: `{ id, name, type, chamber, gateway, status, battery, rssi, firmware, lastSeen }`
- GET /gateways -> data: `{ id, name, facility, devices, uptime, status, ip, fw, lastSync }`
- GET /alerts -> data: `{ id, sev, chamber, title, status, age, owner, rule }`
- GET /notifications -> `{ "notifications": [{ id, icon, tone, title, sub, unread }] }`
- GET /work-orders -> data: `{ id, title, asset, priority, status, assignee, due, sla }`
- GET /dispatch -> data: `{ id, vehicle, reefer, driver, dest, load, eta, status }`
- GET /inventory -> data: `{ id, product, category, chamber, pallets, weight, received, expiry, status }`
- GET /reports -> data: `{ id, name, type, schedule, last }`
- GET /reports/metrics -> `{ "monthly": [{ m, excursions, uptime }] }`
- GET /audit -> data: `{ id, ts, actor, action, target, ip }`
- GET /users -> data: `{ id, name, email, role, facility, status, last }`
- GET /roles -> `{ "roles":[{id,name,users,scope,desc}], "perms":[...], "matrix": { "RoleName":[perms] } }`
- GET /telemetry/history -> `{ "temp":[{t,frozen,chilled,pharma}], "hum":[{t,frozen,chilled}] }`

## Writes
- POST /chambers           body: `{ name, zone, setpoint }`            -> created chamber
- POST /devices            body: `{ name, type, chamber }`             -> created device
- POST /work-orders        body: `{ title, asset, priority }`          -> created work order
- POST /dispatch           body: `{ vehicle, reefer, driver, dest }`   -> created dispatch
- POST /inventory          body: `{ product, category, chamber, pallets, weight }` -> created stock item
- POST /roles              body: `{ name, scope, desc }`               -> created role
- POST /users/invite       body: `{ name, email, role }`               -> created user
- PATCH /alerts/:id/ack         -> `{ ok: true }`
- PATCH /alerts/:id/resolve     -> `{ ok: true }`
- POST /notifications/read-all  -> `{ ok: true }`

## Realtime (WebSocket: VITE_WS_URL, token as query: `?token=<jwt>`)
Server pushes JSON messages:
- `{ "type": "telemetry", "payload": { "t": "HH:MM", "temp": { frozen, chilled, pharma }, "hum": { frozen, chilled } } }`
- `{ "type": "activity",  "payload": { "tone": "blue|emerald|amber|red|slate", "text": "string", "who": "string", "time": "HH:MM:SS" } }`

## Error shape (any non-2xx)
`{ "message": "human readable error" }` - shown to the user by the frontend.
