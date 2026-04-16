# PROJECT_BRAIN.md — Solar IoT Cold Storage Platform

## 1. PROJECT IDENTITY
- **Project Name:** Solar IoT Cold Storage Platform (Cold Storage Web and App)
- **What problem it solves:** Provides reliable, real-time monitoring and control for solar-powered cold storage units. It ensures food and medicine safety by tracking temperature, humidity, and power metrics, and providing instant alerts and OTA (Over-The-Air) firmware updates.
- **Who is it for:** Warehouse Managers, Fleet Operators, Maintenance Engineers, and IoT Hardware Developers.
- **Current status:** [ ] Planning [x] In Progress [ ] Complete [ ] Maintenance (Approx. 95% complete; in final full-stack integration and verification phase).

---

## 2. COMPLETE FOLDER STRUCTURE
/root
  /Cold storage admin panle ⭐ → Vite/React Admin Dashboard (The primary control center).
    /src/main.jsx ⭐          → Frontend Entry Point.
    /src/App.jsx             → Root UI Component & Routing.
    /src/components/         → Reusable UI widgets.
    /src/pages/              → Dashboard, Map, Device Detail, OTA pages.
    netlify.toml             → Deployment config for Netlify.
  /android                   → Native Android App (Kotlin/Compose).
    /app/src/main/           → Mobile application source.
  /backend ⭐                → FastAPI (Python) Backend API & IoT Bridge.
    /app/main.py ⭐           → API Entry Point (FastAPI initialization).
    /app/api/v1/             → REST Endpoints (Auth, Devices, OTA, etc.).
    /app/models/ ⭐           → SQLAlchemy Database Models.
    /app/mqtt/client.py ⭐   → IoT Bridge (Mosquitto/AWS IoT).
    /app/workers/            → Celery Background Tasks (Telemetry, Alerts).
    /alembic/                → TimescaleDB Migration Scripts.
    pyproject.toml           → Backend Dependencies & Version Pinning.
    simulate_device.py       → IoT Telemetry Simulator (for testing).
  /firmware ⭐               → ESP32/IoT Firmware (ESP-IDF C/C++).
    /main/main.c ⭐          → Firmware Entry Point & Logic.
  /infra                     → Infrastructure as Code (Terraform & Docker).
    /docker/                 → Service container definitions.
    /terraform/              → AWS/Cloud Resource definitions.
  /marketing-site            → Vite/React/TypeScript Marketing Website.
  /observability             → Monitoring (Prometheus & Grafana configs).
  /scripts                   → Maintenance and database seeding scripts.
  /web [EMPTY]               → Historically planned, currently consolidated into "Cold storage admin panle".
  PROJECT_MASTER_LOG.md ⭐   → The "Black Box" log of all project decisions and fixes.
  ENGINEERING_HANDOFF.md     → Technical snapshot for context injection.

---

## 3. TECH STACK
- **Python** → 3.12 → Backend language (High-performance API).
- **FastAPI** → 0.111.0 → Web framework (Async support, auto-docs).
- **SQLAlchemy** → 2.0.31 → ORM (Database interaction).
- **TimescaleDB** → PostgreSQL 16 → Time-series database (Optimized for sensor data).
- **Celery** → 5.4.0 → Task Queue (Asynchronous ingestion and alerts).
- **Redis** → 7.2 → Broker & Pub/Sub (Celery broker and real-time stream).
- **Mosquitto** → 2.x → MQTT Broker (Standardized IoT communication).
- **React** → 19.x → Frontend Framework (Modern, performant UI).
- **Vite** → 8.x/7.x → Build Tool (Fast development and bundling).
- **Tailwind CSS** → 4.x/3.x → Styling (Utility-first responsive design).
- **Kotlin** → [Native] → Android development (Jetpack Compose).
- **C/C++** → ESP-IDF → Hardware firmware.
- **Terraform** → [Latest] → Infrastructure provisioning.
- **AWS IoT Core** → [SaaS] → IoT identity and secure messaging (mTLS).

---

## 4. ARCHITECTURE (How it works)
1. **Data Collection:** ESP32 sensors (firmware) collect Temperature, Humidity, and Power data.
2. **Ingestion:** Hardware publishes JSON data to MQTT topics (e.g., `coldstorage/telemetry`).
3. **Bridge:** The `backend/app/mqtt/client.py` bridge subscribes to MQTT and dispatches a Celery task.
4. **Storage:** Celery task (`ingest_telemetry`) writes the data to the **TimescaleDB** hypertable (`sensor_readings`).
5. **Alerting:** The Alert Engine checks readings against thresholds (e.g., Temp > 8°C). If violated, it creates an `Alert` in the DB and signals FCM/WebPush.
6. **Live Streaming:** Every reading is also published to a **Redis channel** (`telemetry_stream`).
7. **Broadcast:** The `StreamManager` (WebSocket service) listens to Redis and broadcasts the data to connected Admin Dashboards.
8. **User Action:** Admin views the map, sees a warning, and can trigger an command (e.g., "Toggle Compressor") which flows back via MQTT Command Topic to the device.

---

## 5. EVERY IMPORTANT FILE — DETAILED BREAKDOWN

### backend/app/main.py
- **Path:** `backend/app/main.py`
- **Purpose:** Central entry point for the FastAPI application.
- **Key functions:** FastAPI startup/shutdown events, CORS middleware setup, router registration.
- **Connected to:** All `api/v1` routers, `db/session.py`.

### backend/app/mqtt/client.py
- **Path:** `backend/app/mqtt/client.py`
- **Purpose:** Acts as a bridge between the MQTT Broker (Mosquitto/AWS) and the Backend application.
- **Key functions:** `_on_message` (receives and routes telemetry), `start()` (connects with mTLS/Standard).
- **Connected to:** `app/workers/ingest.py`, `app/config.py`.

### backend/app/models/sensor_reading.py
- **Path:** `backend/app/models/sensor_reading.py`
- **Purpose:** Defines the data structure for time-series sensor data.
- **Key functions:** SQLAlchemy model for `sensor_readings`.
- **Special notes:** Uses TimescaleDB Hypertables (partitioned by `time`).

### Cold storage admin panle/src/App.jsx
- **Path:** `Cold storage admin panle/src/App.jsx`
- **Purpose:** Root frontend component.
- **Key functions:** Layout wrapper, Route definitions (Map, Device Detail).
- **Connected to:** `src/pages/Dashboard.jsx`, `src/context/AuthContext.jsx`.

### firmware/main/main.c
- **Path:** `firmware/main/main.c`
- **Purpose:** Core hardware logic.
- **Key functions:** Sensor polling loops, WiFi/MQTT connection management, OTA client handlers.

---

## 6. ALL FEATURES
- **Fleet Map:** Interactive map showing all units, their status, and real-time alerts. (Implemented in `Admin Panel -> MapPage`).
- **Real-time Telemetry:** Live charts for temperature and power. (Implemented in `backend/app/api/v1/stream.py` + `Admin Panel -> DeviceChart`).
- **OTA Updates:** Remote firmware deployment with status tracking. (Implemented in `backend/app/api/v1/admin/ota.py`).
- **Threshold Alerts:** User-configurable notifications for critical sensor values. (Implemented in `backend/app/workers/alerts.py`).
- **RBAC Security:** Multi-tenant access control (Superadmin, Admin, Operator). (Implemented in `backend/app/auth/rbac.py`).
- **MFA Login:** TOTP-based Multi-Factor Authentication. (Implemented in `backend/app/auth/security.py`).

---

## 7. DATABASE & DATA STRUCTURE
- **Type:** SQL (PostgreSQL 16 + TimescaleDB Extension).
- **Tables:**
  - `organizations`: Groups users and devices. Fields: `id`, `name`, `region`.
  - `users`: IAM data. Fields: `email`, `password_hash`, `mfa_enabled`, `role`.
  - `devices`: Asset metadata. Fields: `thing_name`, `firmware_version`, `status`, `location`.
  - `sensor_readings` (Hypertable): Metrics. Fields: `time`, `device_id`, `temperature`, `humidity`, `battery_level`.
  - `alerts`: Notification history. Fields: `type`, `severity`, `resolved`.
- **Relationships:**
  - One-to-Many: Organization -> Users
  - One-to-Many: Organization -> Devices
  - One-to-Many: Device -> SensorReadings

---

## 8. APIs & EXTERNAL SERVICES
- **Internal API:** FastAPI REST v1 (Authentication, Device Provisioning, Historical Logs).
- **Internal Stream:** WebSocket Telemetry (Live updates).
- **AWS IoT Core:** Used for mTLS secure messaging and "Thing" certificates.
- **AWS S3:** Host firmware binary files for OTA.
- **Firebase/FCM:** Push notifications for Android.
- **Redis:** Message broker for Celery and WebSocket Pub/Sub.

---

## 9. ENVIRONMENT & CONFIGURATION
- **Key ENV variables (Backend):**
  - `DATABASE_URL`, `REDIS_URL`, `MQTT_BROKER_HOST`, `SECRET_KEY`, `JWT_ALGORITHM`.
- **Config Files:**
  - `backend/app/config.py`: Central Pydantic settings.
  - `docker-compose.yml`: Orchestration for all 6-8 core services.
  - `netlify.toml`: Admin dashboard deployment config.
- **Local Run Steps:**
  1. `docker-compose up -d` (Starts DB, MQTT, Redis).
  2. `cd backend && python -m uvicorn app.main:app` (Optional if not using Docker image).
  3. `cd "Cold storage admin panle" && npm run dev` (Starts UI).
  4. Access via `http://localhost:3000`.

---

## 10. WHAT IS WORKING vs WHAT IS NOT
**Working ✅:**
- Core IoT Ingestion Bridge (MQTT -> DB).
- Real-time WebSocket Telemetry.
- User Authentication (Login / JWT / RBAC).
- Database Schema and Migrations.
- Frontend Dashboard Scaffold.
- Device Simulation Tool.

**Broken / Incomplete ❌:**
- Audit Logging Middleware (Implemented but needs wider API application).
- Mobile App API connectivity verification (Awaiting live environment/IP test).
- Final Database Seeding (Static admin user needs verification).

---

## 11. PENDING TASKS & FUTURE IDEAS
- **Must do (urgent):** Finalize Admin user seed and run full-stack integration test via `docker compose up`.
- **Should do (important):** Verify Android app connection to local API via tunnel/local IP.
- **Nice to have (later):** Predictive maintenance module (AI to predict compressor failure).

---

## 12. TRICKY PARTS & SPECIAL LOGIC
- **TimescaleDB Hypertables:** Standard Alembic `op.create_table` is NOT sufficient. A raw SQL `SELECT create_hypertable(...)` must follow in the migration.
- **Bcrypt Compatibility:** Must pin `bcrypt<4.0.0` to work with `passlib`. Newer versions cause `RuntimeError` during login.
- **mTLS on ESP32:** Certs must be stored in the SPIFFS/LittleFS partition and referenced accurately in `main.c`.
- **CORS vs Credentials:** With `allow_credentials=True`, `CORS_ORIGINS` cannot be `*`. It must be a specific list of domains.

---

## 13. IMPORTANT NOTES FOR NEXT AI SESSION
"Handing over a high-performance Solar IoT system. The core is FastAPI + TimescaleDB + MQTT. The 'Bridge' is the soul of the project — ensure the MQTT loop stays connected. If login fails, check the `bcrypt` version in `.venv`. The system is 95% ready; your job is the final 5% glue (seeding, verification, and live demo). Use `simulate_device.py` to see the dashboard come alive. Good luck."

---
**COMPLETENESS SCORE: 9/10**
UNCLEAR: Exact AWS IAM credentials for S3/IoT are mocked in repo; needs actual AWS environment for live OTA.
