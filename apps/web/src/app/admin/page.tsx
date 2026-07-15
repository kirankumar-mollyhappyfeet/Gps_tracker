'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiGet, apiPatch } from '@/lib/api';
import { AppNav } from '@/components/AppNav';
import { StatusChip, formatTime } from '@/lib/format';

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

const BLOCK_STYLE: Record<string, string> = {
  home: 'border-l-emerald-600 bg-emerald-50',
  traveled: 'border-l-amber-500 bg-amber-50',
  stationary: 'border-l-sky-600 bg-sky-50',
};

export default function AdminPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState('');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [live, setLive] = useState<Live | null>(null);
  const [pings, setPings] = useState<Ping[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [radius, setRadius] = useState(150);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (vid: string) => {
    const [b, l, a] = await Promise.all([
      apiGet<Block[]>(`/vehicles/${vid}/blocks?date=2026-07-15`),
      apiGet<Live>(`/vehicles/${vid}/live`),
      apiGet<Audit[]>(`/vehicles/${vid}/audits`),
    ]);
    setBlocks(b);
    setLive(l);
    setAudits(a);
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
              Live vehicle · location blocks · edit audits
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
                No pings yet — run the simulator.
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
            <h2 className="mb-3 font-display text-xl">Location blocks</h2>
            <p className="mb-4 text-sm text-[var(--muted)]">
              Continuous stays merged — not one row per 15‑min ping.
            </p>
            <ul className="space-y-2">
              {blocks.map((b) => (
                <li key={b.id}>
                  <button
                    type="button"
                    className={`w-full rounded-xl border border-[var(--line)] border-l-4 px-4 py-3 text-left ${BLOCK_STYLE[b.type] ?? ''}`}
                    onClick={async () => {
                      const p = await apiGet<Ping[]>(
                        `/vehicles/${vehicleId}/pings?blockId=${b.id}`,
                      );
                      setPings(p);
                    }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium capitalize">{b.type}</span>
                      <StatusChip status={b.status} />
                    </div>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {formatTime(b.startAt)} –{' '}
                      {b.endAt ? formatTime(b.endAt) : 'open'} ·{' '}
                      {b.centerLat.toFixed(4)}, {b.centerLng.toFixed(4)}
                    </p>
                  </button>
                </li>
              ))}
              {!blocks.length && (
                <p className="text-sm text-[var(--muted)]">No blocks today.</p>
              )}
            </ul>

            {pings.length > 0 && (
              <div className="mt-4 rounded-xl border border-[var(--line)] bg-black/[0.02] p-3">
                <p className="mb-2 text-sm font-medium">
                  Raw pings ({pings.length})
                </p>
                <ul className="max-h-40 space-y-1 overflow-auto font-mono text-xs">
                  {pings.map((p) => (
                    <li key={p.id}>
                      {p.recordedAt} · {p.lat.toFixed(5)}, {p.lng.toFixed(5)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </div>

        <section className="card p-5">
          <h2 className="mb-3 font-display text-xl">Time edit audit</h2>
          {!audits.length && (
            <p className="text-sm text-[var(--muted)]">
              No manual edits yet. Correct times from the Technician screen to
              populate this.
            </p>
          )}
          <ul className="divide-y divide-[var(--line)]">
            {audits.map((a) => (
              <li key={a.id} className="py-3 text-sm">
                <div className="flex flex-wrap justify-between gap-2">
                  <p className="font-medium">
                    {a.field} · {a.editedBy}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {new Date(a.editedAt).toISOString()}
                  </p>
                </div>
                <p className="text-[var(--muted)]">
                  {a.siteVisit.orderLinks
                    .map((l) => l.serviceOrder.customerName)
                    .join(', ') || 'Visit'}{' '}
                  — {a.reason}
                </p>
                <p className="mt-1 font-mono text-xs">
                  {a.oldValue.slice(0, 80)} → {a.newValue.slice(0, 80)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
