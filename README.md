# Knopvvs — GPS Tracking & Time Tracking

Complete MVP for **vehicle GPS** and **technician time tracking** (including multi-order same-building splits).

## Run

```powershell
# Terminal 1 — API
cd C:\Users\Kiran\OneDrive\Desktop\knopvvs
npm run api:dev

# Terminal 2 — Web
npm run web:dev
```

## Reset demo + simulate a full day

```powershell
cd C:\Users\Kiran\OneDrive\Desktop\knopvvs\apps\api
npx prisma db seed
cd ..\..
node scripts\simulate-gps-day.js
```

Simulator creates:

1. **Single order** (Hansen Villa) → visit status `confirmed` → **One-click approve**
2. **Three orders** same building (Acme) → `pending_allocation` → **split times**

## Test in the UI

| Page | URL | What to do |
|------|-----|------------|
| Home | http://localhost:3000 | Overview + instructions |
| Technician | http://localhost:3000/tech | Approve Hansen; allocate Acme 1/2/3; correct times; visit history; Maps route |
| Admin | http://localhost:3000/admin | Live position, location blocks, raw pings, geofence, edit audit |

## Features covered

- GPS ping ingest → Home / Traveled / Stationary blocks
- Geofence arrive (2 pings) / leave → suggested dwell
- Single-order one-click approve (REQ-081 style) + sync queued stub
- Multi-order forced allocation (±30 min)
- Manual time correction + audit
- Visit history per order
- Practical access info on order cards
- Admin GPS timeline + audits

## Tests

```powershell
cd apps\api
npm test
```
