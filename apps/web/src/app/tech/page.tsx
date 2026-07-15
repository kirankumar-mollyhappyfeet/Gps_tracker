'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiGet, apiPost } from '@/lib/api';
import { AllocationForm } from '@/components/AllocationForm';

type Vehicle = { id: string; name: string };
type Visit = {
  id: string;
  status: string;
  arrivedAt?: string;
  departedAt?: string;
  dwellMinutes?: number;
  orderLinks: {
    serviceOrderId: string;
    serviceOrder: { customerName: string; address: string };
  }[];
};

export default function TechPage() {
  const [vehicleId, setVehicleId] = useState<string>('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (vid: string) => {
    const day = await apiGet<{ visits: Visit[] }>(
      `/tech/day?vehicleId=${vid}&date=2026-07-15`,
    );
    setVisits(day.visits);
  }, []);

  useEffect(() => {
    apiGet<Vehicle[]>('/vehicles')
      .then((v) => {
        setVehicles(v);
        if (v[0]) {
          setVehicleId(v[0].id);
          return load(v[0].id);
        }
      })
      .catch((e) => setError(String(e.message ?? e)));
  }, [load]);

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Technician — Site visits
        </h1>
        <p className="text-sm text-slate-600">
          Review GPS times and split multi-order building stops.
        </p>
      </header>

      {error && <p className="text-red-600">{error}</p>}

      <label className="block text-sm">
        Vehicle
        <select
          className="mt-1 w-full rounded border px-2 py-1"
          value={vehicleId}
          onChange={(e) => {
            setVehicleId(e.target.value);
            load(e.target.value);
          }}
        >
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
      </label>

      <section className="space-y-4">
        {visits.map((v) => (
          <article key={v.id} className="rounded border p-4">
            <div className="flex justify-between gap-2">
              <h2 className="font-medium">Visit {v.id.slice(-6)}</h2>
              <span className="text-xs uppercase tracking-wide text-slate-600">
                {v.status}
              </span>
            </div>
            <p className="text-sm text-slate-700">
              Arrive {v.arrivedAt ? new Date(v.arrivedAt).toISOString() : '—'} ·
              Leave {v.departedAt ? new Date(v.departedAt).toISOString() : '—'} ·
              Dwell {v.dwellMinutes ?? '—'} min
            </p>
            <ul className="mt-2 list-disc pl-5 text-sm">
              {v.orderLinks.map((o) => (
                <li key={o.serviceOrderId}>{o.serviceOrder.customerName}</li>
              ))}
            </ul>
            {v.status === 'pending_allocation' && (
              <AllocationForm visit={v} onDone={() => load(vehicleId)} />
            )}
            {v.status === 'confirmed' && (
              <button
                type="button"
                className="mt-3 rounded bg-slate-900 px-3 py-2 text-sm text-white"
                onClick={async () => {
                  await apiPost(`/site-visits/${v.id}/complete`, {
                    editedBy: 'tech-lars',
                  });
                  await load(vehicleId);
                }}
              >
                Confirm & complete
              </button>
            )}
          </article>
        ))}
        {!visits.length && (
          <p className="text-sm text-slate-500">
            No visits yet. Run the GPS simulator first.
          </p>
        )}
      </section>
    </main>
  );
}
