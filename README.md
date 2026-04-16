# ☀️ Solar IoT Cold Storage Monitoring & Control Platform

[![Backend CI](https://github.com/your-org/solar-cold-storage/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/your-org/solar-cold-storage/actions)
[![Web CI](https://github.com/your-org/solar-cold-storage/actions/workflows/web-ci.yml/badge.svg)](https://github.com/your-org/solar-cold-storage/actions)
[![Android CI](https://github.com/your-org/solar-cold-storage/actions/workflows/android-ci.yml/badge.svg)](https://github.com/your-org/solar-cold-storage/actions)

Enterprise-grade IoT platform for monitoring and controlling solar-powered cold storage units at scale.

## Architecture at a Glance

```
ESP32 (mTLS) ──▶ AWS IoT Core ──▶ FastAPI + Celery ──▶ PostgreSQL/TimescaleDB
                                                    ├── React Web Dashboard
                                                    ├── Android App (Compose)
                                                    └── Grafana Observability
```

## Repository Structure

| Directory | Stack | Description |
|---|---|---|
| `/backend` | Python 3.12 / FastAPI | API server, MQTT workers, alert engine |
| `/web` | React / TypeScript / Vite | Web admin dashboard (PWA) |
| `/android` | Kotlin / Jetpack Compose | Android mobile app |
| `/firmware` | ESP-IDF (C) | ESP32 firmware |
| `/infra` | Terraform | AWS infrastructure as code |

## Quick Start (Local Dev)

### Prerequisites
- Docker Desktop
- Python 3.12
- Node.js 20+
- Android Studio (Hedgehog or later)
- ESP-IDF v5.2+

### 1. Start Dev Infrastructure
```bash
docker compose up -d
```
This starts: PostgreSQL + TimescaleDB, Redis, Mosquitto MQTT broker.

### 2. Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -e ".[dev]"
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### 3. Web Frontend
```bash
cd web
npm install
npm run dev
```

### 4. Firmware
```bash
cd firmware
idf.py set-target esp32
idf.py menuconfig               # Set Wi-Fi SSID/password, MQTT endpoint
idf.py build flash monitor
```

## SLA Targets

| Metric | Target |
|---|---|
| API Availability | 99.9% |
| Alert Delivery Latency | < 30 seconds |
| RPO | < 1 hour |
| RTO | < 4 hours |

## Documentation

- [Architecture Plan](docs/architecture/phase1_planning.md)
- [API Reference](http://localhost:8000/docs) (local)
- [DR Runbook](docs/runbooks/disaster_recovery.md)
- [OTA Update Guide](docs/runbooks/ota_update.md)

## License

Proprietary — All rights reserved.
