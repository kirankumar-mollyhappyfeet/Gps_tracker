# Vehicle GPS Site Visit & Time Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver vehicle GPS ingest, location blocks (Home / Traveled / Stationary), geofenced SiteVisits, and post-visit multi-order time allocation (±30 min) with audit, per the approved design.

**Architecture:** NestJS API owns ingest, pure domain modules (geo, blocks, visits, allocation), and Prisma/Postgres persistence. Next.js provides technician allocation UI and admin block timeline + live map. Domain logic is unit-tested first; HTTP and UI wire to those functions.

**Tech Stack:** NestJS, TypeScript, Prisma, PostgreSQL, Jest, Next.js (App Router), Tailwind CSS, shadcn/ui, Google Maps JavaScript API (admin map).

**Spec:** `docs/superpowers/specs/2026-07-15-vehicle-gps-site-visit-time-tracking-design.md`

## Global Constraints

- Vehicle GPS is source of truth for presence; technicians only review/allocate/correct with reason + audit.
- Location UI primary view = **blocks**, not per-ping rows.
- Block types: `home` | `traveled` | `stationary`. Same place = same block with **no max time-gap split**.
- Between places: always insert **`traveled`**.
- SiteVisit arrival after **2 consecutive in-fence pings**; drive-by does not confirm.
- Multi-order (≥2): forced allocation before complete; sum vs dwell within **±30 minutes**.
- Ping ingest idempotent on `(deviceId, timestamp)`.
- Ordrestyring hours sync: stub `TimeSyncPort` only (no live API in MVP).
- Auth/tenant minimal: single-org stub headers or hard-coded `orgId` for MVP (full Phase 0 later).
- Commit after each task when the user/agent is executing with git available; do not `--no-verify`.

---

## File Structure (target)

```
apps/api/
  prisma/schema.prisma
  prisma/seed.ts
  src/main.ts
  src/app.module.ts
  src/gps/
    domain/
      geo.ts                 # haversine, inRadius
      location-block-builder.ts
      site-visit-dwell.ts
      allocation.ts
    gps.module.ts
    gps-ingest.controller.ts
    gps-ingest.service.ts
    location-block.service.ts
    site-visit.service.ts
    allocation.service.ts
    audit.service.ts
    dto/*.ts
    time-sync.port.ts        # stub
  test/ or src/gps/domain/*.spec.ts

apps/web/
  src/app/
    page.tsx                 # redirect
    tech/page.tsx            # day + allocation
    admin/page.tsx           # map + timeline
  src/components/
    BlockTimeline.tsx
    AllocationForm.tsx
    LiveMap.tsx
  src/lib/api.ts
```

---

### Task 1: Scaffold API + Postgres Prisma project

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/nest-cli.json`
- Create: `apps/api/src/main.ts`
- Create: `apps/api/src/app.module.ts`
- Create: `apps/api/prisma/schema.prisma` (minimal placeholder)
- Create: `apps/api/.env.example`
- Create: `package.json` (workspace root)

**Interfaces:**
- Consumes: nothing
- Produces: runnable Nest app on port 3001; `npm test` runs Jest

- [ ] **Step 1: Create root workspace and Nest app**

From repo root `knopvvs`:

```bash
npm init -y
npm pkg set name="knopvvs" private=true
npm pkg set workspaces[0]="apps/*"
npx @nestjs/cli new api --directory apps/api --package-manager npm --skip-git
```

- [ ] **Step 2: Add Prisma + Jest path aliases**

```bash
cd apps/api
npm install @prisma/client
npm install -D prisma @types/jest
npx prisma init
```

Write `apps/api/.env.example`:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/knopvvs_gps?schema=public"
PORT=3001
GEOFENCE_RADIUS_METERS=150
CLUSTER_RADIUS_METERS=150
ALLOCATION_TOLERANCE_MINUTES=30
```

Copy to `.env` and ensure Postgres is running with that database created.

- [ ] **Step 3: Replace default AppController with health**

`apps/api/src/app.controller.ts`:

```typescript
import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  health() {
    return { ok: true };
  }
}
```

- [ ] **Step 4: Verify health**

```bash
cd apps/api && npm run start:dev
```

Expected: GET `http://localhost:3001/health` → `{"ok":true}`

- [ ] **Step 5: Commit**

```bash
git add apps/api package.json package-lock.json
git commit -m "chore: scaffold NestJS API workspace for GPS time tracking"
```

---

### Task 2: Prisma schema for GPS domain

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/seed.ts`
- Create: `apps/api/src/prisma/prisma.service.ts`
- Create: `apps/api/src/prisma/prisma.module.ts`

**Interfaces:**
- Consumes: Task 1 scaffold
- Produces: models `Organization`, `Vehicle`, `GpsDevice`, `GpsPing`, `LocationBlock`, `ServiceOrder`, `SiteVisit`, `SiteVisitOrderLink`, `TimeAllocation`, `TimeEditAudit`

- [ ] **Step 1: Write full schema**

Replace `apps/api/prisma/schema.prisma` with:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum LocationBlockType {
  home
  traveled
  stationary
}

enum LocationBlockStatus {
  open
  closed
}

enum SiteVisitStatus {
  candidate
  on_site
  departed
  pending_allocation
  allocated
  confirmed
  completed
}

enum ServiceOrderStatus {
  scheduled
  arrived
  completed
  cancelled
}

model Organization {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  vehicles  Vehicle[]
  orders    ServiceOrder[]
}

model Vehicle {
  id             String      @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  name           String
  homeLat        Float
  homeLng        Float
  geofenceRadiusMeters Int @default(150)
  device         GpsDevice?
  pings          GpsPing[]
  blocks         LocationBlock[]
  orders         ServiceOrder[]
  siteVisits     SiteVisit[]
  createdAt      DateTime @default(now())
}

model GpsDevice {
  id         String  @id @default(cuid())
  vehicleId  String  @unique
  vehicle    Vehicle @relation(fields: [vehicleId], references: [id])
  externalId String  @unique
}

model GpsPing {
  id        String   @id @default(cuid())
  vehicleId String
  vehicle   Vehicle  @relation(fields: [vehicleId], references: [id])
  deviceId  String
  lat       Float
  lng       Float
  recordedAt DateTime
  speed     Float?
  ignition  Boolean?
  createdAt DateTime @default(now())

  @@unique([deviceId, recordedAt])
  @@index([vehicleId, recordedAt])
}

model LocationBlock {
  id         String              @id @default(cuid())
  vehicleId  String
  vehicle    Vehicle             @relation(fields: [vehicleId], references: [id])
  type       LocationBlockType
  status     LocationBlockStatus @default(open)
  startAt    DateTime
  endAt      DateTime?
  centerLat  Float
  centerLng  Float
  siteVisits SiteVisit[]
  createdAt  DateTime @default(now())

  @@index([vehicleId, startAt])
}

model ServiceOrder {
  id               String             @id @default(cuid())
  organizationId   String
  organization     Organization       @relation(fields: [organizationId], references: [id])
  externalRef      String?
  customerName     String
  address          String
  lat              Float
  lng              Float
  serviceLocationId String?
  scheduledAt      DateTime
  technicianName   String
  vehicleId        String
  vehicle          Vehicle            @relation(fields: [vehicleId], references: [id])
  status           ServiceOrderStatus @default(scheduled)
  visitLinks       SiteVisitOrderLink[]
  allocations      TimeAllocation[]
  createdAt        DateTime @default(now())

  @@index([vehicleId, scheduledAt])
  @@index([serviceLocationId])
}

model SiteVisit {
  id              String          @id @default(cuid())
  vehicleId       String
  vehicle         Vehicle         @relation(fields: [vehicleId], references: [id])
  locationBlockId String?
  locationBlock   LocationBlock?  @relation(fields: [locationBlockId], references: [id])
  status          SiteVisitStatus @default(candidate)
  arrivedAt       DateTime?
  departedAt      DateTime?
  dwellMinutes    Int?
  inFencePingCount Int            @default(0)
  orderLinks      SiteVisitOrderLink[]
  allocations     TimeAllocation[]
  audits          TimeEditAudit[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model SiteVisitOrderLink {
  id             String       @id @default(cuid())
  siteVisitId    String
  siteVisit      SiteVisit    @relation(fields: [siteVisitId], references: [id])
  serviceOrderId String
  serviceOrder   ServiceOrder @relation(fields: [serviceOrderId], references: [id])

  @@unique([siteVisitId, serviceOrderId])
}

model TimeAllocation {
  id             String        @id @default(cuid())
  siteVisitId    String
  siteVisit      SiteVisit     @relation(fields: [siteVisitId], references: [id])
  serviceOrderId String?
  serviceOrder   ServiceOrder? @relation(fields: [serviceOrderId], references: [id])
  minutes        Int
  isNonBillable  Boolean       @default(false)
  createdAt      DateTime      @default(now())
}

model TimeEditAudit {
  id          String    @id @default(cuid())
  siteVisitId String
  siteVisit   SiteVisit @relation(fields: [siteVisitId], references: [id])
  field       String
  oldValue    String
  newValue    String
  reason      String
  editedBy    String
  editedAt    DateTime  @default(now())
}
```

- [ ] **Step 2: Add PrismaModule**

`apps/api/src/prisma/prisma.service.ts`:

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

`apps/api/src/prisma/prisma.module.ts`:

```typescript
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

Import `PrismaModule` in `AppModule`.

- [ ] **Step 3: Migrate and seed**

`apps/api/prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.create({
    data: { name: 'Knop PVS Demo' },
  });
  const vehicle = await prisma.vehicle.create({
    data: {
      organizationId: org.id,
      name: 'Van 1',
      homeLat: 55.6761,
      homeLng: 12.5683,
      geofenceRadiusMeters: 150,
      device: { create: { externalId: 'tracker-van-1' } },
    },
  });
  const clientLat = 55.6800;
  const clientLng = 12.5800;
  await prisma.serviceOrder.createMany({
    data: [
      {
        organizationId: org.id,
        customerName: 'Acme Apt 1',
        address: 'Client Building A - Unit 1',
        lat: clientLat,
        lng: clientLng,
        serviceLocationId: 'loc-building-a',
        scheduledAt: new Date(),
        technicianName: 'Lars',
        vehicleId: vehicle.id,
      },
      {
        organizationId: org.id,
        customerName: 'Acme Apt 2',
        address: 'Client Building A - Unit 2',
        lat: clientLat,
        lng: clientLng,
        serviceLocationId: 'loc-building-a',
        scheduledAt: new Date(),
        technicianName: 'Lars',
        vehicleId: vehicle.id,
      },
      {
        organizationId: org.id,
        customerName: 'Acme Apt 3',
        address: 'Client Building A - Unit 3',
        lat: clientLat,
        lng: clientLng,
        serviceLocationId: 'loc-building-a',
        scheduledAt: new Date(),
        technicianName: 'Lars',
        vehicleId: vehicle.id,
      },
    ],
  });
  console.log({ orgId: org.id, vehicleId: vehicle.id, deviceId: 'tracker-van-1' });
}

main().finally(() => prisma.$disconnect());
```

Wire seed in `package.json`: `"prisma": { "seed": "ts-node prisma/seed.ts" }` (install `ts-node` if needed).

```bash
cd apps/api && npx prisma migrate dev --name init_gps_domain && npx prisma db seed
```

Expected: migration applied; seed prints org/vehicle/device ids.

- [ ] **Step 4: Commit**

```bash
git add apps/api/prisma apps/api/src/prisma apps/api/src/app.module.ts
git commit -m "feat: add Prisma schema for GPS site visits and allocations"
```

---

### Task 3: Geo helpers (haversine + in-radius)

**Files:**
- Create: `apps/api/src/gps/domain/geo.ts`
- Create: `apps/api/src/gps/domain/geo.spec.ts`

**Interfaces:**
- Consumes: none
- Produces:
  - `distanceMeters(a: LatLng, b: LatLng): number`
  - `isWithinRadius(point: LatLng, center: LatLng, radiusMeters: number): boolean`
  - `type LatLng = { lat: number; lng: number }`

- [ ] **Step 1: Write failing tests**

```typescript
import { distanceMeters, isWithinRadius } from './geo';

describe('geo', () => {
  it('returns ~0 for same point', () => {
    expect(distanceMeters({ lat: 55.67, lng: 12.56 }, { lat: 55.67, lng: 12.56 })).toBeLessThan(1);
  });

  it('detects point inside 150m radius', () => {
    const center = { lat: 55.68, lng: 12.58 };
    const near = { lat: 55.6805, lng: 12.58 };
    expect(isWithinRadius(near, center, 150)).toBe(true);
  });

  it('detects point outside 150m radius', () => {
    const center = { lat: 55.68, lng: 12.58 };
    const far = { lat: 55.70, lng: 12.58 };
    expect(isWithinRadius(far, center, 150)).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd apps/api && npx jest src/gps/domain/geo.spec.ts
```

Expected: FAIL (module not found)

- [ ] **Step 3: Implement**

```typescript
export type LatLng = { lat: number; lng: number };

const EARTH_RADIUS_M = 6371000;

export function distanceMeters(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

export function isWithinRadius(point: LatLng, center: LatLng, radiusMeters: number): boolean {
  return distanceMeters(point, center) <= radiusMeters;
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd apps/api && npx jest src/gps/domain/geo.spec.ts
```

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/gps/domain/geo.ts apps/api/src/gps/domain/geo.spec.ts
git commit -m "feat: add geo distance and radius helpers"
```

---

### Task 4: Location block builder (pure)

**Files:**
- Create: `apps/api/src/gps/domain/location-block-builder.ts`
- Create: `apps/api/src/gps/domain/location-block-builder.spec.ts`

**Interfaces:**
- Consumes: `isWithinRadius`, `LatLng` from `geo.ts`
- Produces:
  - `type BlockType = 'home' | 'traveled' | 'stationary'`
  - `type BlockDraft = { type: BlockType; startAt: Date; endAt: Date | null; center: LatLng; status: 'open' | 'closed' }`
  - `applyPingToBlocks(args: { blocks: BlockDraft[]; ping: { at: Date; point: LatLng }; home: LatLng; clusterRadiusMeters: number }): BlockDraft[]`

**Rules to encode:** same place → extend open stationary/home (no gap timeout); leave radius → close + open `traveled`; settle at new place / home → close traveled + open new stationary/home.

- [ ] **Step 1: Write failing tests**

```typescript
import { applyPingToBlocks, BlockDraft } from './location-block-builder';

const home = { lat: 55.6761, lng: 12.5683 };
const client = { lat: 55.68, lng: 12.58 };
const R = 150;

function at(h: number, m: number) {
  return new Date(`2026-07-15T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00.000Z`);
}

describe('applyPingToBlocks', () => {
  it('merges same-place pings into one home block across long gaps', () => {
    let blocks: BlockDraft[] = [];
    blocks = applyPingToBlocks({ blocks, ping: { at: at(6, 0), point: home }, home, clusterRadiusMeters: R });
    blocks = applyPingToBlocks({ blocks, ping: { at: at(8, 0), point: home }, home, clusterRadiusMeters: R });
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('home');
    expect(blocks[0].status).toBe('open');
    expect(blocks[0].startAt).toEqual(at(6, 0));
  });

  it('opens traveled then stationary when moving home → client', () => {
    let blocks: BlockDraft[] = [];
    blocks = applyPingToBlocks({ blocks, ping: { at: at(8, 0), point: home }, home, clusterRadiusMeters: R });
    blocks = applyPingToBlocks({ blocks, ping: { at: at(8, 15), point: { lat: 55.678, lng: 12.574 } }, home, clusterRadiusMeters: R });
    blocks = applyPingToBlocks({ blocks, ping: { at: at(9, 0), point: client }, home, clusterRadiusMeters: R });
    blocks = applyPingToBlocks({ blocks, ping: { at: at(9, 15), point: client }, home, clusterRadiusMeters: R });
    const types = blocks.map((b) => b.type);
    expect(types).toEqual(['home', 'traveled', 'stationary']);
    expect(blocks[0].status).toBe('closed');
    expect(blocks[1].status).toBe('closed');
    expect(blocks[2].status).toBe('open');
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd apps/api && npx jest src/gps/domain/location-block-builder.spec.ts
```

- [ ] **Step 3: Implement builder**

```typescript
import { isWithinRadius, LatLng } from './geo';

export type BlockType = 'home' | 'traveled' | 'stationary';

export type BlockDraft = {
  type: BlockType;
  startAt: Date;
  endAt: Date | null;
  center: LatLng;
  status: 'open' | 'closed';
};

function closeBlock(block: BlockDraft, at: Date): BlockDraft {
  return { ...block, status: 'closed', endAt: at };
}

function classifyStationary(point: LatLng, home: LatLng, radius: number): BlockType {
  return isWithinRadius(point, home, radius) ? 'home' : 'stationary';
}

export function applyPingToBlocks(args: {
  blocks: BlockDraft[];
  ping: { at: Date; point: LatLng };
  home: LatLng;
  clusterRadiusMeters: number;
}): BlockDraft[] {
  const { ping, home, clusterRadiusMeters: R } = args;
  const blocks = args.blocks.map((b) => ({ ...b, center: { ...b.center } }));
  const openIdx = blocks.findIndex((b) => b.status === 'open');

  if (openIdx === -1) {
    const type = classifyStationary(ping.point, home, R);
    blocks.push({ type, startAt: ping.at, endAt: null, center: ping.point, status: 'open' });
    return blocks;
  }

  const open = blocks[openIdx];

  if (open.type === 'traveled') {
    // Stay in traveled until we have... for MVP settle immediately when ping is a stable place:
    // First ping at a new cluster center starts stationary/home; second ping handled by next call.
    blocks[openIdx] = closeBlock(open, ping.at);
    const type = classifyStationary(ping.point, home, R);
    blocks.push({ type, startAt: ping.at, endAt: null, center: ping.point, status: 'open' });
    return blocks;
  }

  // open home or stationary
  if (isWithinRadius(ping.point, open.center, R)) {
    blocks[openIdx] = { ...open, endAt: null, center: open.center };
    return blocks;
  }

  // left place → traveled
  blocks[openIdx] = closeBlock(open, ping.at);
  blocks.push({
    type: 'traveled',
    startAt: ping.at,
    endAt: null,
    center: ping.point,
    status: 'open',
  });
  return blocks;
}
```

Note: arriving at client after traveled closes traveled on the **first** client ping and opens stationary. Spec example (arrive 9:00) matches. Optional later: require 2 pings to settle from travel — not required for MVP block timeline.

- [ ] **Step 4: Run — expect PASS**

```bash
cd apps/api && npx jest src/gps/domain/location-block-builder.spec.ts
```

If travel midpoint ping fails `isWithinRadius` vs home but is mid-route, test expects traveled open then closed at client — adjust test point if flaky.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/gps/domain/location-block-builder.ts apps/api/src/gps/domain/location-block-builder.spec.ts
git commit -m "feat: add location block builder for home/traveled/stationary"
```

---

### Task 5: Site visit dwell gate (pure)

**Files:**
- Create: `apps/api/src/gps/domain/site-visit-dwell.ts`
- Create: `apps/api/src/gps/domain/site-visit-dwell.spec.ts`

**Interfaces:**
- Consumes: `isWithinRadius`
- Produces:
  - `type DwellState = { status: 'none' | 'candidate' | 'on_site' | 'departed'; inFencePingCount: number; arrivedAt?: Date; departedAt?: Date; dwellMinutes?: number }`
  - `applyFencePing(state: DwellState, args: { at: Date; point: LatLng; fenceCenter: LatLng; radiusMeters: number }): DwellState`

- [ ] **Step 1: Failing tests**

```typescript
import { applyFencePing, DwellState } from './site-visit-dwell';

const fence = { lat: 55.68, lng: 12.58 };
const inside = { lat: 55.6802, lng: 12.58 };
const outside = { lat: 55.70, lng: 12.58 };

describe('applyFencePing', () => {
  it('stays candidate after first in-fence ping', () => {
    let s: DwellState = { status: 'none', inFencePingCount: 0 };
    s = applyFencePing(s, { at: new Date('2026-07-15T09:00:00Z'), point: inside, fenceCenter: fence, radiusMeters: 150 });
    expect(s.status).toBe('candidate');
    expect(s.inFencePingCount).toBe(1);
  });

  it('confirms on_site after second consecutive in-fence ping', () => {
    let s: DwellState = { status: 'none', inFencePingCount: 0 };
    s = applyFencePing(s, { at: new Date('2026-07-15T09:00:00Z'), point: inside, fenceCenter: fence, radiusMeters: 150 });
    s = applyFencePing(s, { at: new Date('2026-07-15T09:15:00Z'), point: inside, fenceCenter: fence, radiusMeters: 150 });
    expect(s.status).toBe('on_site');
    expect(s.arrivedAt).toEqual(new Date('2026-07-15T09:00:00Z'));
  });

  it('drive-by does not confirm', () => {
    let s: DwellState = { status: 'none', inFencePingCount: 0 };
    s = applyFencePing(s, { at: new Date('2026-07-15T09:00:00Z'), point: inside, fenceCenter: fence, radiusMeters: 150 });
    s = applyFencePing(s, { at: new Date('2026-07-15T09:15:00Z'), point: outside, fenceCenter: fence, radiusMeters: 150 });
    expect(s.status).toBe('none');
  });

  it('sets departed and dwellMinutes on leave after on_site', () => {
    let s: DwellState = { status: 'none', inFencePingCount: 0 };
    s = applyFencePing(s, { at: new Date('2026-07-15T09:00:00Z'), point: inside, fenceCenter: fence, radiusMeters: 150 });
    s = applyFencePing(s, { at: new Date('2026-07-15T09:15:00Z'), point: inside, fenceCenter: fence, radiusMeters: 150 });
    s = applyFencePing(s, { at: new Date('2026-07-15T11:00:00Z'), point: outside, fenceCenter: fence, radiusMeters: 150 });
    expect(s.status).toBe('departed');
    expect(s.departedAt).toEqual(new Date('2026-07-15T11:00:00Z'));
    expect(s.dwellMinutes).toBe(120);
  });
});
```

- [ ] **Step 2: Run — FAIL**

- [ ] **Step 3: Implement**

```typescript
import { isWithinRadius, LatLng } from './geo';

export type DwellState = {
  status: 'none' | 'candidate' | 'on_site' | 'departed';
  inFencePingCount: number;
  arrivedAt?: Date;
  departedAt?: Date;
  dwellMinutes?: number;
  lastInFenceAt?: Date;
};

export function applyFencePing(
  state: DwellState,
  args: { at: Date; point: LatLng; fenceCenter: LatLng; radiusMeters: number },
): DwellState {
  const inside = isWithinRadius(args.point, args.fenceCenter, args.radiusMeters);

  if (state.status === 'departed') return state;

  if (inside) {
    if (state.status === 'on_site') {
      return { ...state, lastInFenceAt: args.at };
    }
    const count = state.inFencePingCount + 1;
    if (count === 1) {
      return {
        status: 'candidate',
        inFencePingCount: 1,
        arrivedAt: args.at,
        lastInFenceAt: args.at,
      };
    }
    return {
      status: 'on_site',
      inFencePingCount: count,
      arrivedAt: state.arrivedAt ?? args.at,
      lastInFenceAt: args.at,
    };
  }

  // outside
  if (state.status === 'candidate') {
    return { status: 'none', inFencePingCount: 0 };
  }
  if (state.status === 'on_site' && state.arrivedAt) {
    const end = state.lastInFenceAt ?? args.at;
    const dwellMinutes = Math.round((end.getTime() - state.arrivedAt.getTime()) / 60000);
    return {
      status: 'departed',
      inFencePingCount: state.inFencePingCount,
      arrivedAt: state.arrivedAt,
      departedAt: end,
      dwellMinutes,
      lastInFenceAt: state.lastInFenceAt,
    };
  }
  return state;
}
```

- [ ] **Step 4: PASS + commit**

```bash
git add apps/api/src/gps/domain/site-visit-dwell.ts apps/api/src/gps/domain/site-visit-dwell.spec.ts
git commit -m "feat: add site visit dwell gate (2-ping confirm)"
```

---

### Task 6: Allocation validator (±30 minutes)

**Files:**
- Create: `apps/api/src/gps/domain/allocation.ts`
- Create: `apps/api/src/gps/domain/allocation.spec.ts`

**Interfaces:**
- Produces:
  - `type AllocationLine = { serviceOrderId: string | null; minutes: number; isNonBillable: boolean }`
  - `validateAllocations(args: { dwellMinutes: number; lines: AllocationLine[]; toleranceMinutes?: number }): { ok: true } | { ok: false; error: string }`

- [ ] **Step 1: Failing tests**

```typescript
import { validateAllocations } from './allocation';

describe('validateAllocations', () => {
  it('accepts sum within ±30 of dwell', () => {
    const r = validateAllocations({
      dwellMinutes: 120,
      lines: [
        { serviceOrderId: 'a', minutes: 40, isNonBillable: false },
        { serviceOrderId: 'b', minutes: 40, isNonBillable: false },
        { serviceOrderId: 'c', minutes: 30, isNonBillable: false },
        { serviceOrderId: null, minutes: 5, isNonBillable: true },
      ],
      toleranceMinutes: 30,
    });
    expect(r.ok).toBe(true);
  });

  it('rejects when difference exceeds 30', () => {
    const r = validateAllocations({
      dwellMinutes: 120,
      lines: [{ serviceOrderId: 'a', minutes: 50, isNonBillable: false }],
      toleranceMinutes: 30,
    });
    expect(r.ok).toBe(false);
  });

  it('requires at least one line when order count >= 2 path is used by caller', () => {
    const r = validateAllocations({ dwellMinutes: 60, lines: [], toleranceMinutes: 30 });
    expect(r.ok).toBe(false);
  });
});
```

- [ ] **Step 2–4: Implement and pass**

```typescript
export type AllocationLine = {
  serviceOrderId: string | null;
  minutes: number;
  isNonBillable: boolean;
};

export function validateAllocations(args: {
  dwellMinutes: number;
  lines: AllocationLine[];
  toleranceMinutes?: number;
}): { ok: true } | { ok: false; error: string } {
  const tolerance = args.toleranceMinutes ?? 30;
  if (args.lines.length === 0) {
    return { ok: false, error: 'At least one allocation line is required' };
  }
  for (const line of args.lines) {
    if (!Number.isFinite(line.minutes) || line.minutes < 0) {
      return { ok: false, error: 'Minutes must be a non-negative number' };
    }
    if (!line.isNonBillable && !line.serviceOrderId) {
      return { ok: false, error: 'Billable lines require serviceOrderId' };
    }
  }
  const sum = args.lines.reduce((s, l) => s + l.minutes, 0);
  const delta = Math.abs(sum - args.dwellMinutes);
  if (delta > tolerance) {
    return {
      ok: false,
      error: `Allocation sum ${sum} must be within ±${tolerance} minutes of dwell ${args.dwellMinutes} (delta ${delta})`,
    };
  }
  return { ok: true };
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/gps/domain/allocation.ts apps/api/src/gps/domain/allocation.spec.ts
git commit -m "feat: validate multi-order time allocation within ±30 minutes"
```

---

### Task 7: GPS ping ingest + block pipeline service

**Files:**
- Create: `apps/api/src/gps/dto/ingest-ping.dto.ts`
- Create: `apps/api/src/gps/gps-ingest.service.ts`
- Create: `apps/api/src/gps/gps-ingest.controller.ts`
- Create: `apps/api/src/gps/location-block.service.ts`
- Create: `apps/api/src/gps/site-visit.service.ts`
- Create: `apps/api/src/gps/gps.module.ts`
- Create: `apps/api/src/gps/gps-ingest.service.spec.ts` (integration-style with Prisma mock or test DB)
- Modify: `apps/api/src/app.module.ts`

**Interfaces:**
- Consumes: domain functions from Tasks 3–5; Prisma models
- Produces:
  - `POST /gps/pings` body `{ deviceExternalId: string; lat: number; lng: number; recordedAt: string; speed?: number; ignition?: boolean }` → `{ pingId, duplicate: boolean }`
  - Side effects: upsert blocks; update/create SiteVisit; link cluster orders by `serviceLocationId` + vehicle

- [ ] **Step 1: Write service test for idempotent ingest**

```typescript
// Sketch: mock Prisma or use test database
it('second identical ping returns duplicate true and does not create second row', async () => {
  // call ingest twice with same deviceExternalId + recordedAt
  // expect duplicate on second call
});
```

- [ ] **Step 2: Implement DTO + controller + services**

`ingest-ping.dto.ts`:

```typescript
import { IsBoolean, IsISO8601, IsNumber, IsOptional, IsString } from 'class-validator';

export class IngestPingDto {
  @IsString()
  deviceExternalId!: string;

  @IsNumber()
  lat!: number;

  @IsNumber()
  lng!: number;

  @IsISO8601()
  recordedAt!: string;

  @IsOptional()
  @IsNumber()
  speed?: number;

  @IsOptional()
  @IsBoolean()
  ignition?: boolean;
}
```

`GpsIngestService.ingest(dto)` algorithm:

1. Find `GpsDevice` by `externalId` → vehicle (404 if missing).
2. Try `gpsPing.create`; on unique violation return `{ duplicate: true }`.
3. Load open `LocationBlock` for vehicle; map to `BlockDraft[]` (open + recent closed of day optional: load last closed + open).
4. `applyPingToBlocks`; persist: update/create blocks to match draft list.
5. If open block is `stationary` (not home): find today's assigned `ServiceOrder`s for vehicle where `isWithinRadius(order, ping, radius)` OR same `serviceLocationId` cluster near ping.
6. Load or create `SiteVisit` for this block; `applyFencePing` using first linked order coords (or cluster centroid); persist status; on `departed` with ≥2 links set `pending_allocation`, with 1 link set `confirmed` eligible.
7. On `on_site`, set linked orders status `arrived`.

- [ ] **Step 3: Wire module + enable ValidationPipe in `main.ts`**

```typescript
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
```

- [ ] **Step 4: Manual smoke with seed device**

```bash
curl -X POST http://localhost:3001/gps/pings -H "Content-Type: application/json" -d "{\"deviceExternalId\":\"tracker-van-1\",\"lat\":55.6761,\"lng\":12.5683,\"recordedAt\":\"2026-07-15T06:00:00.000Z\"}"
```

Expected: 201 with ping id; LocationBlock `home` open.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/gps apps/api/src/app.module.ts apps/api/src/main.ts
git commit -m "feat: GPS ping ingest with block builder and site visit updates"
```

---

### Task 8: Allocation + audit + complete APIs

**Files:**
- Create: `apps/api/src/gps/allocation.service.ts`
- Create: `apps/api/src/gps/allocation.controller.ts`
- Create: `apps/api/src/gps/dto/save-allocation.dto.ts`
- Create: `apps/api/src/gps/dto/edit-visit.dto.ts`
- Create: `apps/api/src/gps/audit.service.ts`
- Create: `apps/api/src/gps/time-sync.port.ts`
- Create: `apps/api/src/gps/allocation.service.spec.ts`

**Interfaces:**
- Produces:
  - `GET /site-visits/:id`
  - `POST /site-visits/:id/allocations` body `{ editedBy: string; lines: { serviceOrderId?: string; minutes: number; isNonBillable?: boolean }[] }`
  - `PATCH /site-visits/:id/times` body `{ arrivedAt?: string; departedAt?: string; reason: string; editedBy: string }`
  - `POST /site-visits/:id/complete` body `{ editedBy: string }`
  - `TimeSyncPort.enqueueApprovedHours(visitId: string): Promise<void>` stub logs only

- [ ] **Step 1: Test allocation reject outside ±30**

```typescript
it('rejects allocations when sum outside tolerance', async () => {
  // site visit dwellMinutes=120, lines totaling 50 → BadRequest
});
```

- [ ] **Step 2: Implement AllocationService**

Rules:

- Visit must be `departed` or `pending_allocation`.
- If `orderLinks.length >= 2`, require `validateAllocations` pass; then status → `allocated`.
- If `orderLinks.length === 1`, allow confirm without multi lines (optional single line equaling dwell within tolerance).
- Replace existing allocations in a transaction.
- Complete: requires `allocated` or `confirmed`; sets `completed`; calls `TimeSyncPort` stub.

Edit times: update arrive/leave/dwell; write `TimeEditAudit` rows; if ≥2 orders set status back to `pending_allocation` and clear allocations.

- [ ] **Step 3: Manual API smoke for 3 seed orders**

Simulate pings: home → travel mid → client ×2 → outside. Then POST allocations for three order ids totaling dwell ±30. Then complete.

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: site visit allocation, time edits with audit, and complete"
```

---

### Task 9: Read APIs for tech + admin timelines

**Files:**
- Create: `apps/api/src/gps/query.controller.ts`
- Create: `apps/api/src/gps/query.service.ts`

**Interfaces:**
- Produces:
  - `GET /vehicles/:id/blocks?date=YYYY-MM-DD` → blocks for day
  - `GET /vehicles/:id/pings?blockId=` → raw pings in block window
  - `GET /vehicles/:id/live` → last ping + open block
  - `GET /tech/day?vehicleId=&date=` → orders + site visits needing allocation

- [ ] **Step 1: Implement query endpoints returning JSON shaped for UI**

Example block item: `{ id, type, startAt, endAt, centerLat, centerLng, status }`.

- [ ] **Step 2: Smoke with curl**

- [ ] **Step 3: Commit**

```bash
git commit -m "feat: query APIs for block timeline and tech day view"
```

---

### Task 10: Next.js web app scaffold + API client

**Files:**
- Create: `apps/web/*` (Next.js)
- Create: `apps/web/src/lib/api.ts`
- Create: `apps/web/.env.example` (`NEXT_PUBLIC_API_URL=http://localhost:3001`)

- [ ] **Step 1: Scaffold**

```bash
npx create-next-app@latest apps/web --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --turbopack false
```

- [ ] **Step 2: Add api helper**

```typescript
const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
```

Enable CORS on Nest for `http://localhost:3000`.

- [ ] **Step 3: Commit**

```bash
git commit -m "chore: scaffold Next.js web app for GPS portals"
```

---

### Task 11: Technician UI — day view + allocation form

**Files:**
- Create: `apps/web/src/app/tech/page.tsx`
- Create: `apps/web/src/components/AllocationForm.tsx`
- Create: `apps/web/src/components/VisitCard.tsx`

**Interfaces:**
- Consumes: `GET /tech/day`, `POST /site-visits/:id/allocations`, `POST /site-visits/:id/complete`

- [ ] **Step 1: Build VisitCard showing arrive/leave/dwell and linked orders**

- [ ] **Step 2: AllocationForm**

- Inputs: minutes per linked order + optional non-billable.
- Show dwell total, running sum, delta; disable Save unless `|sum - dwell| <= 30`.
- On save call allocations then enable Complete.

- [ ] **Step 3: Manual UI test with seed multi-order visit**

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: technician allocation UI for multi-order site visits"
```

---

### Task 12: Admin UI — block timeline + live map

**Files:**
- Create: `apps/web/src/app/admin/page.tsx`
- Create: `apps/web/src/components/BlockTimeline.tsx`
- Create: `apps/web/src/components/LiveMap.tsx`

**Interfaces:**
- Consumes: `GET /vehicles/:id/blocks`, `GET /vehicles/:id/live`, `GET /vehicles/:id/pings`

- [ ] **Step 1: BlockTimeline** — horizontal or stacked list coloring `home` / `traveled` / `stationary`; click expands raw pings.

- [ ] **Step 2: LiveMap** — Google Maps marker at last ping (requires `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`). If key missing, show lat/lng text fallback so feature still demoable.

- [ ] **Step 3: Manual check Home → Traveled → Client blocks after scripted pings**

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: admin location block timeline and live vehicle map"
```

---

### Task 13: Ping simulator script + README

**Files:**
- Create: `scripts/simulate-gps-day.ts`
- Create: `apps/api/README.md` (GPS feature runbook)
- Modify: root `README.md` with how to run demo

- [ ] **Step 1: Simulator posts the design day**

Sequence for `tracker-van-1`:

1. 06:00, 06:15, 07:00, 08:00 home  
2. 08:15 mid-route  
3. 09:00, 09:15, 10:00, 11:00 client  
4. 11:15 away from client  

Assert via query API: blocks types `home,traveled,stationary` (+ maybe traveled after leave); site visit departed with 3 order links.

- [ ] **Step 2: Document**

How to: migrate, seed, start api/web, run simulator, allocate in tech UI.

- [ ] **Step 3: Commit**

```bash
git commit -m "docs: GPS day simulator and runbook"
```

---

### Task 14: Final verification checklist

- [ ] **Step 1: Run all API unit tests**

```bash
cd apps/api && npm test
```

Expected: all domain specs PASS.

- [ ] **Step 2: End-to-end demo checklist**

1. Seed DB  
2. Run simulator  
3. Admin timeline shows Home → Traveled → Client  
4. Tech UI forces allocation for 3 orders  
5. Allocation at dwell±30 saves; outside rejects  
6. Edit arrive/leave writes audit and re-requires allocation  
7. Complete succeeds; TimeSync stub logs  

- [ ] **Step 3: Update design status line to “Approved — implemented MVP”** in the spec header after demo passes (optional).

- [ ] **Step 4: Final commit if any fixes**

```bash
git commit -m "test: verify GPS site visit MVP end-to-end checklist"
```

---

## Spec coverage (self-review)

| Spec item | Task(s) |
|-----------|---------|
| GpsPing ingest + idempotency | 7 |
| Location blocks Home/Traveled/Stationary | 4, 7, 12 |
| No max gap same-place merge | 4 tests |
| Traveled between places | 4, 13 |
| 2-ping dwell gate / drive-by | 5, 7 |
| SiteVisit + order cluster | 7 |
| Multi-order allocation ±30 | 6, 8, 11 |
| Manual edit + audit | 8 |
| Tech portal | 11 |
| Admin map/timeline/config radius on Vehicle | 2, 12 (radius on vehicle; admin edit config can be PATCH later if time — default via seed/schema) |
| TimeSync stub | 8 |
| Simulator / scalability note | 13 (functional; load testing out of MVP) |

**Gap handled:** Admin “configure geofence radius” — Vehicle has `geofenceRadiusMeters`; if UI config not built in Task 12, add `PATCH /vehicles/:id` in Task 12 Step 2 with a simple number input on admin page.

**Placeholder scan:** none intentional; implementers must fill Nest service bodies in Tasks 7–9 following the algorithms stated (not “TBD”).

**Type consistency:** `BlockDraft`, `DwellState`, `AllocationLine`, Prisma enums aligned to design statuses.
