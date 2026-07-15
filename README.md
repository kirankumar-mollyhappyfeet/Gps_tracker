# Knopvvs — Vehicle GPS Site Visit Time Tracking

MVP for vehicle GPS → location blocks (Home / Traveled / Stationary) → site visits → multi-order time allocation (±30 minutes).

## Prerequisites

- Node.js 20+
- Local SQLite (default — Docker Hub Postgres was unavailable during setup)

## Setup

```bash
npm install
cd apps/api
cp .env.example .env
npx prisma migrate dev
npx prisma db seed
```

## Run

Terminal 1 — API (port 3001):

```bash
npm run api:dev
```

Terminal 2 — Web (port 3000):

```bash
npm run web:dev
```

## Demo day simulator

With the API running:

```bash
node scripts/simulate-gps-day.js
```

Expected blocks: `home → traveled → stationary → traveled`  
Expected visit: `pending_allocation` with 3 orders and ~120 min dwell.

Then open http://localhost:3000/tech to allocate time across the three building orders, or http://localhost:3000/admin for the block timeline.

## Tests

```bash
cd apps/api && npm test
```

## Notes

- Device id in seed: `tracker-van-1`
- Allocation tolerance: ±30 minutes (`ALLOCATION_TOLERANCE_MINUTES`)
- Ordrestyring hours sync is stubbed (`StubTimeSync`)
- Switch `DATABASE_URL` to Postgres when available (see `.env.example`)
