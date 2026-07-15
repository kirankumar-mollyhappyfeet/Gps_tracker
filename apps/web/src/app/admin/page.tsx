'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiGet, apiPatch } from '@/lib/api';
import { BlockTimeline } from '@/components/BlockTimeline';
import { LiveMap } from '@/components/LiveMap';

type Vehicle = { id: string; name: string; geofenceRadiusMeters: number };
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

export default function AdminPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState('');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [live, setLive] = useState<Live | null>(null);
  const [pings, setPings] = useState<Ping[]>([]);
  const [radius, setRadius] = useState(150);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (vid: string) => {
    const [b, l] = await Promise.all([
      apiGet<Block[]>(`/vehicles/${vid}/blocks?date=2026-07-15`),
      apiGet<Live>(`/vehicles/${vid}/live`),
    ]);
    setBlocks(b);
    setLive(l);
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

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Admin — Vehicle GPS
        </h1>
        <p className="text-sm text-slate-600">
          Location blocks and live position (not per-ping primary view).
        </p>
      </header>

      {error && <p className="text-red-600">{error}</p>}

      <label className="block text-sm">
        Vehicle
        <select
          className="mt-1 w-full rounded border px-2 py-1"
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

      <section className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="mb-2 font-medium">Block timeline</h2>
          <BlockTimeline
            blocks={blocks}
            onSelect={async (blockId) => {
              const p = await apiGet<Ping[]>(
                `/vehicles/${vehicleId}/pings?blockId=${blockId}`,
              );
              setPings(p);
            }}
          />
        </div>
        <div>
          <h2 className="mb-2 font-medium">Live</h2>
          <LiveMap live={live} />
          <div className="mt-4 space-y-2">
            <h3 className="text-sm font-medium">Geofence radius (m)</h3>
            <div className="flex gap-2">
              <input
                type="number"
                className="w-28 rounded border px-2 py-1"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
              />
              <button
                type="button"
                className="rounded bg-slate-900 px-3 py-1 text-sm text-white"
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
        </div>
      </section>

      {pings.length > 0 && (
        <section>
          <h2 className="mb-2 font-medium">Raw pings (selected block)</h2>
          <ul className="max-h-48 overflow-auto text-xs">
            {pings.map((p) => (
              <li key={p.id}>
                {p.recordedAt} · {p.lat.toFixed(5)}, {p.lng.toFixed(5)}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
