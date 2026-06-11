# SEPL ColdChain - Cold Storage Monitoring & Operations Platform (Frontend)

Production-oriented React frontend for cold-storage operators. Feature-based
architecture, React Query for server state, Zustand for client state, token
auth, realtime via WebSocket, validated forms, and a mock/live switch.

## Run

```bash
npm install
npm run dev          # http://localhost:5173
```

## Mock vs Live

The app now ships in **LIVE** mode (`VITE_USE_MOCK=false`) - it shows **only real
backend data**, no mock/demo data anywhere. Until the backend URL is set you will
see clean empty states ("Waiting for live telemetry", "No data yet") instead of
fake numbers.

### Connect your backend (3 steps, no code changes)
1. Get the API base URL + WebSocket URL from the backend developer.
2. Put them in `.env`:
```
VITE_USE_MOCK=false           # already false
VITE_API_BASE_URL=https://api.sepl.in      # backend REST base URL
VITE_WS_URL=wss://api.sepl.in/realtime      # backend WebSocket URL
```
3. `npm run build` (or restart `npm run dev`). Done - every screen, the dashboard
   KPIs/charts, and the live feed now run on real data.

### Want to preview the UI without a backend?
Flip one switch to load built-in demo data: set `VITE_USE_MOCK=true` in `.env`,
restart. (Demo login is shown on the login screen in this mode.) Set it back to
`false` before going live.

## How data flows
```
UI page -> feature hook (React Query) -> api adapter -> httpClient (fetch + JWT)
                                                     \-> mockServer (demo only)
realtime: WebSocket -> realtimeStore -> charts/feed
auth: authStore -> session (localStorage JWT) -> httpClient sends Bearer token
```

## What the BACKEND must provide
See **CONTRACT.md** for every endpoint, method, and JSON shape the frontend
expects. Build those endpoints, set the env vars, flip the mock switch.

## Honest limitations (read before demoing as "live")
- **Mock mode is fake data.** Charts/feed are simulated until a real WS is wired.
- **Frontend RBAC is UX only.** Hiding a menu is not security - the backend
  MUST enforce permissions on every endpoint and validate the JWT.
- **No automated tests yet** and **JavaScript (not TypeScript).** Both are
  recommended next steps for an enterprise codebase.
- Telemetry history seed is local; in live mode load it from
  `GET /telemetry/history`.

## Structure
```
src/
  config/env.js            # reads VITE_* env vars
  app/
    layout/                # Sidebar, Topbar, AppLayout, navConfig
    providers/             # QueryProvider, ErrorBoundary
  features/<domain>/
    *Page.jsx              # screen
    api.js                 # React Query hooks for that domain
  shared/
    auth/                  # session (JWT), permissions, Can
    components/            # DataTable, Modal, FormField, Badge, KpiCard...
    hooks/                 # query helpers, useClock, useRealtime, useFacilities
    realtime/socket.js     # WebSocket client (+ mock channel)
    services/              # api adapter, httpClient, endpoints, realApi, mockServer, mockData
    utils/                 # cn, format, tokens
  stores/                  # authStore, uiStore, realtimeStore (client state only)
```
