# Tour Secure Pro Monorepo (Extended Scaffold)

A richer, runnable scaffold for **Smart Tourist Safety Monitoring & Incident Response System**.

## Apps & Services
- **frontend/** (React + TypeScript + Tailwind) – Full multi-tab UI (Home, Heatmap, Reviews, Itinerary, eFIR, Digital ID, About) with SOS, safety scores, and API wiring.
- **backend/** (Node + Express + TS + Prisma + Postgres) – Users, Reviews, Itinerary, Zones, eFIR, Alerts, SafetyScore proxy, Blockchain proxy (read & upsert).
- **services/geofencing/** (FastAPI) – Configurable GeoJSON-like zones (from `zones.json`), polygon containment & distance fallback.
- **services/anomaly/** (FastAPI) – Rule-based route checks (deviation & inactivity) with extension points for ML models.
- **blockchain/** (Hardhat + Solidity) – `TouristID` contract with upsert & read; deploy writes address to `deployed.json` and mirrors to backend.
- **docker-compose.yml** – One command to run all services.

## Quick Start
```bash
docker compose up --build
# Frontend: http://localhost:5173
# Backend:  http://localhost:8080/api
```

### Notes
- Prisma migrations are applied on backend start (`prisma migrate deploy`).
- Hardhat local node deploys `TouristID` on boot; backend reads ABI+address and exposes REST endpoints.
- Geofencing reads `services/geofencing/app/zones.json` (edit & restart to change scores).

## API Map (selected)
- `GET /api/health`
- `GET /api/safety/score?lat=..&lon=..`
- `POST /api/alerts/panic`
- `POST /api/efir` { name, contact, description }
- `GET /api/heatmap/zones`
- `GET /api/reviews` / `POST /api/reviews`
- `GET /api/itinerary/:userId` / `POST /api/itinerary/:userId`
- `GET /api/blockchain/tourist/:id` / `POST /api/blockchain/tourist`

This is a **developer-friendly baseline**: everything compiles & runs; you can grow features incrementally.
