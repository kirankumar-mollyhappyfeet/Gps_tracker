# Vehicle GPS Site Visit & Time Tracking — Design

**Date:** 2026-07-15  
**Status:** Approved  
**Source:** `docs/Vehicle_GPS_Service_Order_Time_Tracking_Requirements.md` + multi-order same-location allocation  
**References:** Buddy Punch / Jibble / GreytHR–style post-visit time review  

---

## 1. Goal

Build vehicle GPS–driven presence tracking for plumbing field service:

- Dedicated vehicle GPS trackers (not phone GPS) are the source of truth for **where the van is**.
- Consolidate continuous pings into **location blocks** (Home, Traveled, stationary places) instead of one event per ping.
- When a stationary block matches a service-order geofence long enough, create a **SiteVisit** with automatic arrive/leave.
- Technician reviews times; when **2+ service orders share the same site**, they **must allocate** dwell time across orders before completing the visit.
- All manual time edits are audited.

---

## 2. Scope

### In scope (MVP)

- Vehicle / GPS device registry and continuous ping ingest (~15 minute cadence; device assumed 24/7 with internet).
- Location block builder: **Home**, **Traveled**, **Stationary (other/client)**.
- Geofence matching to assigned service orders → SiteVisit.
- Arrival confirmation after sustained in-fence presence (2 consecutive in-fence pings on ~15 min cadence).
- Departure when ping cluster moves outside fence → close SiteVisit dwell.
- Post-visit review and **forced multi-order time allocation** (Approach A).
- Manual correction of arrive/leave/allocations with reason + audit.
- Technician portal and admin live map / block timeline / geofence config / edit review.
- Minimal Service Order fields needed for this feature (stub-friendly if full CRM not yet built).

### Out of scope (MVP)

- Mid-visit “now working on Order X” job switching (possible later hybrid).
- Phone GPS as primary tracker.
- Live Ordrestyring hours sync (define interface; implement stub or queue later).
- Future enhancements from the requirements MD: route playback, fuel, idle analytics, ETA, driver behavior, etc.
- Full FSM Phase 0 platform (auth/tenant can be minimal for this vertical if building in isolation).

---

## 3. Core concepts

### 3.1 GpsPing

Raw telemetry from the device:

- `vehicleId`, `deviceId`, `lat`, `lng`, `timestamp`
- Optional: `speed`, `ignition`
- Ingest is **idempotent** on `(deviceId, timestamp)`.

### 3.2 LocationBlock

Summary of consecutive presence — **not** one row per ping.

| Type | Meaning |
|------|---------|
| `home` | Stationary at configured home/depot |
| `traveled` | Moving between places |
| `stationary` | Stationary at some other place (client site, shop, etc.) |

**Rules:**

- Expected ping interval ~15 minutes; tracker assumed always on with connectivity.
- Consecutive pings within clustering radius → **same stationary block**. Duration may be 1 hour, 2 hours, overnight — **no max gap timeout** that splits same-place stays.
- First ping outside the current stationary cluster → close that block and open **`traveled`**.
- When pings settle in a new cluster → close `traveled`, open new `stationary` (or `home` if matches depot).
- UI default view = **block timeline**. Raw pings available under drill-down only.
- Home overnight / idle at depot = normal `home` blocks; they do **not** become SiteVisits unless they overlap an assigned order geofence (unusual).

**Example day**

| From–To | Block |
|---------|--------|
| 06:00–08:00 | Home |
| 08:00–09:00 | Traveled |
| 09:00–… | Stationary at client (may become SiteVisit) |

### 3.3 SiteVisit

Created when a `stationary` LocationBlock overlaps an **assigned** service-order geofence and passes the dwell gate.

- Links one vehicle + one location + arrive/leave + dwell duration.
- Links **one or many** service orders at that location (cluster).
- GPS is source of truth for presence; tech is source of truth for **which order received the minutes**.

### 3.4 Same-location cluster

Orders share a SiteVisit when:

- Same **ServiceLocation ID** (preferred), or
- Geocode / coords within geofence radius of visit arrival, and
- Assigned to the **same vehicle** for an overlapping schedule window.

### 3.5 Time allocation (Approach A)

- **1 linked order:** after leave, tech reviews and confirms (optional edit + reason).
- **2+ linked orders:** tech **must** complete an allocation screen before visit completion.
- Allocations: minutes (or hours) per order + optional **non-billable / waiting** bucket.
- **Tolerance:** sum of allocations must equal SiteVisit dwell within **±30 minutes** (configurable later; MVP fixed at 30).
- Reject save until within tolerance.

---

## 4. States

### LocationBlock

`open` → `closed`

### SiteVisit

`candidate` → `on_site` → `departed` → `pending_allocation` (if N≥2) → `allocated` / `confirmed` → `completed`

- Single order: `departed` → `confirmed` (skip allocation) → `completed`.
- Drive-by (fails dwell gate): never reaches billable `on_site` / no complete flow required.

### Service order status (feature-relevant)

At minimum support: scheduled / arrived (on site) / completed, plus whatever the wider FSM already uses. Confirming SiteVisit arrive may set linked orders to **Arrived**.

---

## 5. Architecture

```
GPS device ──~15min──► Ingest API ──► GpsPing store
                              │
                              ▼
                     LocationBlock builder
                     (home | traveled | stationary)
                              │
                              ▼
              Geofence match vs assigned ServiceOrders
                              │
                              ▼
                         SiteVisit
                              │
              ┌───────────────┴───────────────┐
              │ 1 order                         │ N≥2 orders
              ▼                                 ▼
         Confirm times              Force allocation (±30 min)
              │                                 │
              └─────────── Audit ◄──────────────┘
                              │
                              ▼
                    Complete / (later) sync hours
```

### Components

| Component | Responsibility |
|-----------|----------------|
| Device registry | Vehicle ↔ tracker ID, home/depot points |
| Ingest API | Validate, idempotent write, enqueue processing |
| Block builder | Merge same place; open traveled on leave; new place on settle |
| Geofence engine | Radius config; in/out; dwell gate (2 consecutive in-fence pings) |
| SiteVisit service | Create/link orders; dwell calc; allocation validation |
| Tech portal | Orders, blocks/visits, allocation UI, edits, notes, attachments |
| Admin | Live map, block timeline, history, audits, geofence/home config, reports |
| Audit log | Every manual change: field, old, new, reason, actor, timestamp |

### Minimal Service Order fields (this feature)

- Service Order ID  
- Customer  
- Customer address  
- GPS coordinates (or ServiceLocation with coords)  
- Scheduled time  
- Assigned technician  
- Assigned vehicle  
- Job status  

---

## 6. Dwell / geofence rules

1. First in-fence ping → SiteVisit **`candidate`** (optional “maybe on site” in UI).
2. Confirm **`on_site`** and `arrivedAt` only after **2 consecutive in-fence pings** (~15–30 minutes of presence on a 15 min cadence). Avoids drive-by false arrives.
3. `departedAt`: first out-of-fence ping that ends the stationary cluster; dwell = leave − arrive (document exact rounding in implementation: use last in-fence timestamp as end for MVP).
4. Home and Traveled blocks never produce SiteVisits by themselves.

---

## 7. Permissions

| Role | Capabilities |
|------|----------------|
| Technician | Own/assigned vehicles & orders; view blocks/visits; allocate; edit own times with reason; notes/attachments; complete |
| Dispatcher / Admin | All vehicles; live map; block + ping history; review edits; geofence radius; home/depot config; reports |
| System (GPS) | Pings, blocks, SiteVisit presence only — never invents per-order allocations |

---

## 8. Error handling

| Situation | Behavior |
|-----------|----------|
| Bad/unknown vehicle coords | Reject to dead-letter; log; do not corrupt open blocks |
| Duplicate ping | No-op |
| Order missing GPS coords | Cannot auto SiteVisit; surface “missing location” |
| No assigned orders that day | Still build Home / Traveled / Other blocks for admin |
| Complete multi-order without allocation | Blocked |
| Allocation outside ±30 min of dwell | Reject save |
| Manual arrive/leave edit | Recalc dwell; if N≥2 require re-allocation; write audit |
| Unexpected silence | Show last-seen on admin; do not invent blocks until next ping |

---

## 9. UI flows

### Technician

1. Day view of assigned orders and related SiteVisits.  
2. After confirmed on-site / after leave: review auto times.  
3. One order → confirm (edit + reason if needed) → complete.  
4. Multiple orders → allocation UI (total dwell, per-order fields, optional non-billable) → save when within ±30 min → complete.  
5. Optional notes / attachments.

### Admin

1. Live vehicle map.  
2. Per-vehicle **block timeline** (Home | Traveled | Places).  
3. Drill-down to raw pings.  
4. SiteVisit and allocation audit review.  
5. Config: geofence radius, home/depot, allocation tolerance (MVP hardcoded 30 min; config later).

---

## 10. Data model (logical)

- `Vehicle`, `GpsDevice`, `GpsPing`
- `LocationBlock` (type, start, end, center/place ref, vehicleId)
- `ServiceOrder` (minimal fields above)
- `SiteVisit` (vehicle, locationBlock or place, arrivedAt, departedAt, dwell, status)
- `SiteVisitOrderLink`
- `TimeAllocation` (siteVisitId, serviceOrderId nullable for non-billable, minutes)
- `TimeEditAudit`

---

## 11. Stack fit (FSM platform)

Align with project brief when scaffolding:

- **API:** NestJS module(s) for GPS ingest, blocks, visits, allocations  
- **DB:** PostgreSQL + Prisma  
- **Web:** Next.js + Tailwind + shadcn/ui (tech + admin)  
- **Maps:** Google Maps (live map, geocode)  
- **Jobs:** queue or background worker for block builder / geofence (keep ingest fast)

Ordrestyring hours push: interface only in MVP (`TimeSyncPort`); real adapter later (REQ-081).

---

## 12. Testing priorities

- Block builder: same place merge; leave → Traveled → new stationary/home.  
- Geofence: two in-fence pings → SiteVisit; single drive-by → no confirmed visit.  
- Multi-order allocation within ±30 min; reject outside.  
- Audit on edits.  
- Idempotent ping ingest.

---

## 13. Decisions log

| Decision | Choice |
|----------|--------|
| Multi-order UX | Approach A — post-visit forced allocation |
| Allocation vs dwell tolerance | ±30 minutes |
| Location summary | Blocks (not per-ping primary UI) |
| Between places | Explicit **Traveled** block |
| Same-place merge | No max time gap; same place = same block |
| Device availability | Assumed 24/7 + internet |
| Arrival gate | 2 consecutive in-fence pings |
| GPS vs tech | GPS = presence; tech = per-order minutes |

---

## 14. Open for implementation plan (not blocking design)

- Exact geofence default radius (e.g. 100–150 m).  
- Home/depot as single point vs polygon.  
- Whether non-billable bucket is required or optional.  
- Whether ±30 min tolerance is admin-configurable in v1 or hard-coded.

---

## 15. Success criteria

- Admin sees a clean Home → Traveled → Client block timeline for a workday.  
- Single-order stop: auto arrive/leave, tech confirms, completes.  
- Same-building 3 orders: one SiteVisit, tech allocates times, save allowed within ±30 min of dwell, audit on changes.  
- Drive-by and home idle do not create false billable visits.
