'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiGet, apiPatch, apiPost } from '@/lib/api';
import { AppNav } from '@/components/AppNav';
import { AllocationForm } from '@/components/AllocationForm';
import { StatusChip, formatTime, mapsUrl } from '@/lib/format';

type Vehicle = { id: string; name: string };
type Order = {
  id: string;
  customerName: string;
  address: string;
  lat: number;
  lng: number;
  status: string;
  scheduledAt: string;
  jobDescription: string;
  keyBoxLocation?: string;
  accessCodes?: string;
  parkingInfo?: string;
  onSiteContact?: string;
  onSitePhone?: string;
  safetyNotes?: string;
  visitLinks: { siteVisit: { id: string; status: string; dwellMinutes?: number; arrivedAt?: string; departedAt?: string } }[];
};
type Visit = {
  id: string;
  status: string;
  arrivedAt?: string;
  departedAt?: string;
  dwellMinutes?: number;
  notes?: string;
  syncStatus?: string;
  orderLinks: {
    serviceOrderId: string;
    serviceOrder: Order;
  }[];
};

type Day = {
  orders: Order[];
  visits: Visit[];
  summary: {
    totalOrders: number;
    needsAction: number;
    onSite: number;
    completed: number;
  };
};

export default function TechPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState('');
  const [day, setDay] = useState<Day | null>(null);
  const [historyOrderId, setHistoryOrderId] = useState<string | null>(null);
  const [history, setHistory] = useState<{
    order: Order;
    visits: Visit[];
  } | null>(null);
  const [editVisit, setEditVisit] = useState<Visit | null>(null);
  const [editArrive, setEditArrive] = useState('');
  const [editDepart, setEditDepart] = useState('');
  const [editReason, setEditReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (vid: string) => {
    const d = await apiGet<Day>(
      `/tech/day?vehicleId=${vid}&date=2026-07-15`,
    );
    setDay(d);
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

  async function openHistory(orderId: string) {
    setHistoryOrderId(orderId);
    const h = await apiGet<{ order: Order; visits: Visit[] }>(
      `/orders/${orderId}/visits`,
    );
    setHistory(h);
  }

  return (
    <div>
      <AppNav />
      <main className="shell space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl tracking-tight">
              Technician day
            </h1>
            <p className="text-[var(--muted)]">
              GPS suggests times · you approve or split multi-order stops
            </p>
          </div>
          <label className="text-sm">
            Vehicle
            <select
              className="field mt-1 min-w-[10rem]"
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
        </div>

        {error && (
          <p className="card border-red-300 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </p>
        )}

        {day && (
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              ['Orders', day.summary.totalOrders],
              ['Needs action', day.summary.needsAction],
              ['On site', day.summary.onSite],
              ['Completed', day.summary.completed],
            ].map(([label, value]) => (
              <div key={label as string} className="card p-4">
                <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
                  {label}
                </p>
                <p className="font-display text-3xl">{value}</p>
              </div>
            ))}
          </div>
        )}

        <section className="space-y-4">
          <h2 className="font-display text-xl">Site visits needing review</h2>
          {!day?.visits.length && (
            <p className="card p-4 text-sm text-[var(--muted)]">
              No visits yet. Seed DB and run{' '}
              <code className="rounded bg-black/5 px-1">
                node scripts/simulate-gps-day.js
              </code>
            </p>
          )}
          {day?.visits.map((v) => (
            <article key={v.id} className="card overflow-hidden">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--line)] bg-black/[0.02] px-5 py-4">
                <div>
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <StatusChip status={v.status} />
                    {v.syncStatus === 'queued' && (
                      <StatusChip status="queued" />
                    )}
                    <span className="text-xs text-[var(--muted)]">
                      {v.orderLinks.length} order
                      {v.orderLinks.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <p className="text-sm">
                    Arrive {formatTime(v.arrivedAt)} · Leave{' '}
                    {formatTime(v.departedAt)} · Dwell{' '}
                    <strong>{v.dwellMinutes ?? '—'} min</strong>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(v.status === 'confirmed' ||
                    v.status === 'pending_allocation' ||
                    v.status === 'allocated') && (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => {
                        setEditVisit(v);
                        setEditArrive(
                          v.arrivedAt
                            ? new Date(v.arrivedAt).toISOString().slice(0, 16)
                            : '',
                        );
                        setEditDepart(
                          v.departedAt
                            ? new Date(v.departedAt).toISOString().slice(0, 16)
                            : '',
                        );
                        setEditReason('');
                      }}
                    >
                      Correct times
                    </button>
                  )}
                  {v.status === 'confirmed' && v.orderLinks.length === 1 && (
                    <button
                      type="button"
                      className="btn btn-accent"
                      disabled={busy}
                      onClick={async () => {
                        setBusy(true);
                        try {
                          await apiPost(`/site-visits/${v.id}/approve`, {
                            editedBy: 'tech-lars',
                          });
                          await load(vehicleId);
                        } catch (e) {
                          setError(String((e as Error).message ?? e));
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      One-click approve time
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-3 px-5 py-4">
                {v.orderLinks.map((ol) => {
                  const o = ol.serviceOrder;
                  return (
                    <div
                      key={ol.serviceOrderId}
                      className="rounded-xl border border-[var(--line)] p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{o.customerName}</p>
                          <p className="text-sm text-[var(--muted)]">
                            {o.address}
                          </p>
                          <p className="mt-1 text-sm">{o.jobDescription}</p>
                        </div>
                        <StatusChip status={o.status} />
                      </div>
                      <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                        {o.keyBoxLocation && (
                          <div>
                            <dt className="text-[var(--muted)]">Key box</dt>
                            <dd>{o.keyBoxLocation}</dd>
                          </div>
                        )}
                        {o.accessCodes && (
                          <div>
                            <dt className="text-[var(--muted)]">Codes</dt>
                            <dd>{o.accessCodes}</dd>
                          </div>
                        )}
                        {o.parkingInfo && (
                          <div>
                            <dt className="text-[var(--muted)]">Parking</dt>
                            <dd>{o.parkingInfo}</dd>
                          </div>
                        )}
                        {o.onSiteContact && (
                          <div>
                            <dt className="text-[var(--muted)]">Contact</dt>
                            <dd>
                              {o.onSiteContact} {o.onSitePhone}
                            </dd>
                          </div>
                        )}
                        {o.safetyNotes && (
                          <div className="sm:col-span-2">
                            <dt className="text-[var(--muted)]">Safety</dt>
                            <dd>{o.safetyNotes}</dd>
                          </div>
                        )}
                      </dl>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <a
                          className="btn btn-ghost"
                          href={mapsUrl(o.lat, o.lng)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open route in Maps
                        </a>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => openHistory(o.id)}
                        >
                          Visit history
                        </button>
                      </div>
                    </div>
                  );
                })}

                {v.status === 'pending_allocation' && (
                  <AllocationForm visit={v} onDone={() => load(vehicleId)} />
                )}
              </div>
            </article>
          ))}
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl">All assigned orders</h2>
          <div className="grid gap-3">
            {day?.orders.map((o) => (
              <div key={o.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-medium">
                    {o.customerName}{' '}
                    <span className="text-sm font-normal text-[var(--muted)]">
                      · {new Date(o.scheduledAt).toISOString().slice(11, 16)} UTC
                    </span>
                  </p>
                  <p className="text-sm text-[var(--muted)]">{o.address}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusChip status={o.status} />
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => openHistory(o.id)}
                  >
                    History
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {editVisit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="card w-full max-w-md space-y-3 p-5">
              <h3 className="font-display text-xl">Correct GPS times</h3>
              <p className="text-sm text-[var(--muted)]">
                Reason is required (audit trail).
              </p>
              <label className="block text-sm">
                Arrived
                <input
                  type="datetime-local"
                  className="field mt-1"
                  value={editArrive}
                  onChange={(e) => setEditArrive(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                Departed
                <input
                  type="datetime-local"
                  className="field mt-1"
                  value={editDepart}
                  onChange={(e) => setEditDepart(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                Reason
                <input
                  className="field mt-1"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="e.g. Waited for tenant"
                />
              </label>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setEditVisit(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!editReason}
                  onClick={async () => {
                    await apiPatch(`/site-visits/${editVisit.id}/times`, {
                      arrivedAt: new Date(editArrive).toISOString(),
                      departedAt: new Date(editDepart).toISOString(),
                      reason: editReason,
                      editedBy: 'tech-lars',
                    });
                    setEditVisit(null);
                    await load(vehicleId);
                  }}
                >
                  Save correction
                </button>
              </div>
            </div>
          </div>
        )}

        {history && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="card max-h-[80vh] w-full max-w-lg overflow-auto p-5">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-display text-xl">Visit history</h3>
                  <p className="text-sm text-[var(--muted)]">
                    {history.order.customerName}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setHistory(null);
                    setHistoryOrderId(null);
                  }}
                >
                  Close
                </button>
              </div>
              {!history.visits.length && (
                <p className="text-sm text-[var(--muted)]">No visits yet.</p>
              )}
              <ul className="space-y-2">
                {history.visits.map((v) => (
                  <li key={v.id} className="rounded-lg border border-[var(--line)] p-3 text-sm">
                    <StatusChip status={v.status} />
                    <p className="mt-1">
                      {formatTime(v.arrivedAt)} – {formatTime(v.departedAt)} ·{' '}
                      {v.dwellMinutes ?? '—'} min
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
