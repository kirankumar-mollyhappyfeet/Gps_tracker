'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiGet, apiPatch } from '@/lib/api';
import { AppNav } from '@/components/AppNav';
import { formatTime } from '@/lib/format';
import { StatusChip } from '@/components/StatusChip';

type Vehicle = {
  id: string;
  name: string;
  geofenceRadiusMeters: number;
  homeLat: number;
  homeLng: number;
  device?: { externalId: string };
};
type Block = {
  id: string;
  type: string;
  status: string;
  startAt: string;
  endAt: string | null;
  centerLat: number;
  centerLng: number;
};
type Live = {
  lastPing: { lat: number; lng: number; recordedAt: string } | null;
  openBlock: { type: string; status: string } | null;
};
type Ping = { id: string; lat: number; lng: number; recordedAt: string };
type Audit = {
  id: string;
  field: string;
  oldValue: string;
  newValue: string;
  reason: string;
  editedBy: string;
  editedAt: string;
  siteVisit: {
    id: string;
    orderLinks: { serviceOrder: { customerName: string } }[];
  };
};
type Order = {
  id: string;
  customerName: string;
  address: string;
  lat: number;
  lng: number;
};
type Visit = {
  id: string;
  status: string;
  arrivedAt?: string;
  departedAt?: string;
  dwellMinutes?: number;
  orderLinks: { serviceOrderId: string; serviceOrder: Order }[];
};

const BLOCK_STYLE: Record<string, string> = {
  home: 'border-l-emerald-600 bg-emerald-50',
  traveled: 'border-l-amber-500 bg-amber-50',
  stationary: 'border-l-sky-600 bg-sky-50',
};

const BLOCK_LABEL: Record<string, string> = {
  home: 'Home / depot',
  traveled: 'Traveling',
  stationary: 'Stationary stop',
};

function distanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

function matchVisitToBlock(
  block: Block,
  visits: Visit[],
  fenceMeters: number,
): Visit | null {
  if (block.type !== 'stationary' && block.type !== 'home') return null;
  const center = { lat: block.centerLat, lng: block.centerLng };
  const candidates = visits.filter((v) =>
    v.orderLinks.some(
      (l) =>
        distanceMeters(center, {
          lat: l.serviceOrder.lat,
          lng: l.serviceOrder.lng,
        }) <= fenceMeters,
    ),
  );
  if (!candidates.length) return null;
  // Prefer visit whose arrive time is near this block window
  const blockStart = new Date(block.startAt).getTime();
  return (
    [...candidates].sort((a, b) => {
      const da = Math.abs(
        new Date(a.arrivedAt ?? a.departedAt ?? 0).getTime() - blockStart,
      );
      const db = Math.abs(
        new Date(b.arrivedAt ?? b.departedAt ?? 0).getTime() - blockStart,
      );
      return da - db;
    })[0] ?? null
  );
}

const FIELD_LABEL: Record<string, string> = {
  notes: 'Visit notes',
  status: 'Visit status',
  arrivedAt: 'Arrival time',
  departedAt: 'Departure time',
  dwellMinutes: 'Dwell minutes',
};

function minutesBetween(a: string, b: string | null) {
  if (!b) return null;
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60000);
}

function formatAuditValue(field: string, value: string) {
  if (!value) return '(empty)';
  if (
    (field === 'arrivedAt' || field === 'departedAt') &&
    !Number.isNaN(Date.parse(value))
  ) {
    return new Date(value).toISOString().replace('T', ' ').slice(0, 19) + 'Z';
  }
  return value.length > 120 ? `${value.slice(0, 120)}…` : value;
}

export default function AdminPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState('');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [live, setLive] = useState<Live | null>(null);
  const [pings, setPings] = useState<Ping[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [radius, setRadius] = useState(150);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (vid: string) => {
    const [b, l, a, day] = await Promise.all([
      apiGet<Block[]>(`/vehicles/${vid}/blocks?date=2026-07-15`),
      apiGet<Live>(`/vehicles/${vid}/live`),
      apiGet<Audit[]>(`/vehicles/${vid}/audits`),
      apiGet<{ orders: Order[]; visits: Visit[] }>(
        `/tech/day?vehicleId=${vid}&date=2026-07-15`,
      ),
    ]);
    setBlocks(b);
    setLive(l);
    setAudits(a);
    setVisits(day.visits);
    setOrders(day.orders);
    setSelectedBlockId(null);
    setPings([]);
  }, []);

  useEffect(() => {
    apiGet<Vehicle[]>('/vehicles')
      .then((v) => {
        setVehicles(v);
        if (v[0]) {
          setVehicleId(v[0].id);
          setRadius(v[0].geofenceRadiusMeters);
          return load(v[0].id);
        }
      })
      .catch((e) => setError(String(e.message ?? e)));
  }, [load]);

  const vehicle = vehicles.find((v) => v.id === vehicleId);
  const fence = vehicle?.geofenceRadiusMeters ?? radius;
  const selectedBlock = useMemo(
    () => blocks.find((b) => b.id === selectedBlockId) ?? null,
    [blocks, selectedBlockId],
  );

  const enrichedBlocks = useMemo(
    () =>
      blocks.map((b) => ({
        block: b,
        visit: matchVisitToBlock(b, visits, fence),
      })),
    [blocks, visits, fence],
  );

  const dayStory = useMemo(() => {
    return enrichedBlocks.map(({ block: b, visit }, i) => {
      const mins = minutesBetween(b.startAt, b.endAt);
      if (b.type === 'home') {
        return `${i + 1}. Home depot ${formatTime(b.startAt)}–${b.endAt ? formatTime(b.endAt) : 'open'}${mins != null ? ` (${mins} min)` : ''}`;
      }
      if (b.type === 'traveled') {
        return `${i + 1}. Travel ${formatTime(b.startAt)}–${b.endAt ? formatTime(b.endAt) : 'open'}`;
      }
      if (visit) {
        const names = visit.orderLinks
          .map((l) => l.serviceOrder.customerName)
          .join(', ');
        return `${i + 1}. At ${names}: arrived ${formatTime(visit.arrivedAt)}, left ${formatTime(visit.departedAt)}, dwell ${visit.dwellMinutes ?? mins ?? '—'} min`;
      }
      return `${i + 1}. Stationary ${formatTime(b.startAt)}–${b.endAt ? formatTime(b.endAt) : 'open'} (no matching order)`;
    });
  }, [enrichedBlocks]);

  return (
    <div>
      <AppNav />
      <main className="shell space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl tracking-tight">
              Admin — GPS tracking
            </h1>
            <p className="text-[var(--muted)]">
              Live vehicle · day timeline · time-edit audit
            </p>
          </div>
          <label className="text-sm">
            Vehicle
            <select
              className="field mt-1 min-w-[10rem]"
              value={vehicleId}
              onChange={(e) => {
                const id = e.target.value;
                setVehicleId(id);
                const v = vehicles.find((x) => x.id === id);
                if (v) setRadius(v.geofenceRadiusMeters);
                load(id);
              }}
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && (
          <p className="card border-red-300 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </p>
        )}

        <div className="grid gap-4 lg:grid-cols-5">
          <section className="card space-y-4 p-5 lg:col-span-2">
            <h2 className="font-display text-xl">Live position</h2>
            {live?.lastPing ? (
              <>
                <div
                  className="relative flex h-56 items-end overflow-hidden rounded-xl border border-[var(--line)]"
                  style={{
                    background:
                      'linear-gradient(160deg, #c5d5c0 0%, #9eb6c9 45%, #6f8799 100%)',
                  }}
                >
                  <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--accent)] ring-4 ring-white/70" />
                  <div className="w-full bg-black/45 p-3 text-sm text-white">
                    <p>
                      {live.lastPing.lat.toFixed(5)},{' '}
                      {live.lastPing.lng.toFixed(5)}
                    </p>
                    <p className="text-xs opacity-80">
                      {new Date(live.lastPing.recordedAt).toISOString()} ·{' '}
                      {live.openBlock?.type ?? 'no open block'}
                    </p>
                  </div>
                </div>
                <a
                  className="btn btn-primary"
                  href={`https://www.google.com/maps?q=${live.lastPing.lat},${live.lastPing.lng}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open live point in Maps
                </a>
              </>
            ) : (
              <p className="text-sm text-[var(--muted)]">
                No pings yet — run the simulator or POST to /gps/pings.
              </p>
            )}

            <div className="border-t border-[var(--line)] pt-4">
              <h3 className="text-sm font-medium">Geofence radius</h3>
              <p className="mb-2 text-xs text-[var(--muted)]">
                Device {vehicle?.device?.externalId ?? '—'} · Home{' '}
                {vehicle
                  ? `${vehicle.homeLat.toFixed(3)}, ${vehicle.homeLng.toFixed(3)}`
                  : '—'}
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  className="field w-28"
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                />
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={async () => {
                    await apiPatch(`/vehicles/${vehicleId}/geofence`, {
                      geofenceRadiusMeters: radius,
                    });
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </section>

          <section className="card p-5 lg:col-span-3">
            <h2 className="mb-1 font-display text-xl">Day timeline</h2>
            <p className="mb-3 text-sm text-[var(--muted)]">
              GPS merges pings into continuous blocks. Click a row for raw
              pings.
            </p>

            <div className="mb-4 grid gap-2 rounded-xl border border-[var(--line)] bg-black/[0.02] p-3 text-xs text-[var(--muted)] sm:grid-cols-3">
              <p>
                <span className="font-medium text-[var(--ink)]">Home</span> —
                inside depot geofence (
                {vehicle
                  ? `${vehicle.homeLat.toFixed(4)}, ${vehicle.homeLng.toFixed(4)}`
                  : '…'}
                , radius {fence} m).
              </p>
              <p>
                <span className="font-medium text-[var(--ink)]">Traveling</span>{' '}
                — left last cluster; not yet confirmed as a new stop (first ping
                after moving).
              </p>
              <p>
                <span className="font-medium text-[var(--ink)]">Stationary</span>{' '}
                — stayed put away from depot. If within {fence} m of an order,
                matched as a site visit with arrive / dwell / leave.
              </p>
            </div>

            {dayStory.length > 0 && (
              <div className="mb-4 rounded-xl border border-[var(--line)] p-3">
                <p className="mb-2 text-xs uppercase tracking-wide text-[var(--muted)]">
                  Day story
                </p>
                <ol className="list-decimal space-y-1 pl-4 text-sm">
                  {dayStory.map((line) => (
                    <li key={line}>{line.replace(/^\d+\.\s/, '')}</li>
                  ))}
                </ol>
              </div>
            )}

            {orders.length > 0 && (
              <p className="mb-3 text-xs text-[var(--muted)]">
                Order geofences today:{' '}
                {orders
                  .map(
                    (o) =>
                      `${o.customerName} (${o.lat.toFixed(4)}, ${o.lng.toFixed(4)})`,
                  )
                  .join(' · ')}
              </p>
            )}

            <ol className="space-y-2">
              {enrichedBlocks.map(({ block: b, visit }, i) => {
                const mins = minutesBetween(b.startAt, b.endAt);
                const selected = b.id === selectedBlockId;
                const names =
                  visit?.orderLinks
                    .map((l) => l.serviceOrder.customerName)
                    .join(', ') ?? null;
                return (
                  <li key={b.id}>
                    <button
                      type="button"
                      className={`w-full rounded-xl border border-l-4 px-4 py-3 text-left transition ${
                        BLOCK_STYLE[b.type] ?? 'border-l-slate-400'
                      } ${
                        selected
                          ? 'border-[var(--ink)] ring-2 ring-[var(--ink)]/20'
                          : 'border-[var(--line)]'
                      }`}
                      onClick={async () => {
                        setSelectedBlockId(b.id);
                        const p = await apiGet<Ping[]>(
                          `/vehicles/${vehicleId}/pings?blockId=${b.id}`,
                        );
                        setPings(p);
                      }}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium">
                          {i + 1}. {BLOCK_LABEL[b.type] ?? b.type}
                          {names ? ` · ${names}` : ''}
                        </span>
                        <StatusChip status={b.status} />
                      </div>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        Block {formatTime(b.startAt)} –{' '}
                        {b.endAt ? formatTime(b.endAt) : 'still open'}
                        {mins != null ? ` · ${mins} min` : ''}
                      </p>
                      {visit && (
                        <p className="mt-1 text-sm text-[var(--ink)]">
                          Arrived {formatTime(visit.arrivedAt)} · Left{' '}
                          {formatTime(visit.departedAt)} · Spent{' '}
                          <strong>
                            {visit.dwellMinutes ?? mins ?? '—'} min
                          </strong>
                          {visit.status ? (
                            <>
                              {' '}
                              · <StatusChip status={visit.status} />
                            </>
                          ) : null}
                        </p>
                      )}
                      {b.type === 'traveled' && (
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          Between stops — GPS moved outside the previous
                          cluster ({fence} m).
                        </p>
                      )}
                      {b.type === 'home' && (
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          Matched configured depot lat/lng.
                        </p>
                      )}
                      {b.type === 'stationary' && !visit && (
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          Stopped away from depot — no service order within{' '}
                          {fence} m of this block center.
                        </p>
                      )}
                      <p className="mt-0.5 font-mono text-xs text-[var(--muted)]">
                        Center {b.centerLat.toFixed(4)},{' '}
                        {b.centerLng.toFixed(4)}
                      </p>
                    </button>
                  </li>
                );
              })}
              {!blocks.length && (
                <p className="text-sm text-[var(--muted)]">No blocks today.</p>
              )}
            </ol>
          </section>
        </div>

        {selectedBlock && (
          <section className="card space-y-3 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl">
                  Pings in selected block
                </h2>
                <p className="text-sm text-[var(--muted)]">
                  {BLOCK_LABEL[selectedBlock.type] ?? selectedBlock.type} ·{' '}
                  {formatTime(selectedBlock.startAt)} –{' '}
                  {selectedBlock.endAt
                    ? formatTime(selectedBlock.endAt)
                    : 'open'}{' '}
                  · {pings.length} ping{pings.length === 1 ? '' : 's'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  className="btn btn-ghost"
                  href={`https://www.google.com/maps?q=${selectedBlock.centerLat},${selectedBlock.centerLng}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open center in Maps
                </a>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setSelectedBlockId(null);
                    setPings([]);
                  }}
                >
                  Clear selection
                </button>
              </div>
            </div>
            {!pings.length ? (
              <p className="text-sm text-[var(--muted)]">Loading pings…</p>
            ) : (
              <ul className="max-h-56 divide-y divide-[var(--line)] overflow-auto rounded-xl border border-[var(--line)] bg-black/[0.02]">
                {pings.map((p, idx) => (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 font-mono text-xs"
                  >
                    <span>
                      #{idx + 1} ·{' '}
                      {new Date(p.recordedAt).toISOString().slice(11, 19)} UTC
                    </span>
                    <a
                      className="text-[var(--info)] underline"
                      href={`https://www.google.com/maps?q=${p.lat},${p.lng}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {p.lat.toFixed(5)}, {p.lng.toFixed(5)}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <section className="card p-5">
          <h2 className="mb-1 font-display text-xl">Time edit audit</h2>
          <p className="mb-4 text-sm text-[var(--muted)]">
            Manual corrections and note changes only — not GPS pings or location
            blocks.
          </p>
          {!audits.length && (
            <p className="text-sm text-[var(--muted)]">
              No edits yet. Use “Correct times” on the Technician screen to
              populate this list.
            </p>
          )}
          <ul className="divide-y divide-[var(--line)]">
            {audits.map((a) => {
              const customers =
                a.siteVisit.orderLinks
                  .map((l) => l.serviceOrder.customerName)
                  .join(', ') || 'Unknown visit';
              return (
                <li key={a.id} className="grid gap-2 py-4 text-sm sm:grid-cols-[1fr_auto]">
                  <div className="space-y-1">
                    <p className="font-medium">
                      {FIELD_LABEL[a.field] ?? a.field} on {customers}
                    </p>
                    <p className="text-[var(--muted)]">
                      {a.reason} · by {a.editedBy}
                    </p>
                    <div className="mt-2 grid gap-1 rounded-lg border border-[var(--line)] bg-black/[0.02] p-3 font-mono text-xs">
                      <p>
                        <span className="text-[var(--muted)]">Before:</span>{' '}
                        {formatAuditValue(a.field, a.oldValue)}
                      </p>
                      <p>
                        <span className="text-[var(--muted)]">After:</span>{' '}
                        {formatAuditValue(a.field, a.newValue)}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-[var(--muted)] sm:text-right">
                    {new Date(a.editedAt).toISOString().replace('T', ' ').slice(0, 19)}Z
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      </main>
    </div>
  );
}
