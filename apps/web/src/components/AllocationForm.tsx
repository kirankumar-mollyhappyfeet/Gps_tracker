'use client';

import { useMemo, useState } from 'react';
import { apiPost } from '@/lib/api';

type OrderLink = {
  serviceOrderId: string;
  serviceOrder: { customerName: string; address: string };
};

type Visit = {
  id: string;
  status: string;
  arrivedAt?: string;
  departedAt?: string;
  dwellMinutes?: number;
  orderLinks: OrderLink[];
};

export function AllocationForm({
  visit,
  onDone,
}: {
  visit: Visit;
  onDone: () => void;
}) {
  const orders = visit.orderLinks;
  const [minutes, setMinutes] = useState<Record<string, number>>(() => {
    const even = Math.floor((visit.dwellMinutes ?? 0) / Math.max(orders.length, 1));
    const init: Record<string, number> = {};
    orders.forEach((o) => {
      init[o.serviceOrderId] = even;
    });
    return init;
  });
  const [nonBillable, setNonBillable] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const sum = useMemo(
    () =>
      Object.values(minutes).reduce((a, b) => a + (Number(b) || 0), 0) +
      (Number(nonBillable) || 0),
    [minutes, nonBillable],
  );
  const dwell = visit.dwellMinutes ?? 0;
  const delta = Math.abs(sum - dwell);
  const ok = delta <= 30;

  async function saveAndComplete() {
    setBusy(true);
    setError(null);
    try {
      await apiPost(`/site-visits/${visit.id}/allocations`, {
        editedBy: 'tech-lars',
        lines: [
          ...orders.map((o) => ({
            serviceOrderId: o.serviceOrderId,
            minutes: Number(minutes[o.serviceOrderId]) || 0,
            isNonBillable: false,
          })),
          ...(nonBillable > 0
            ? [{ minutes: Number(nonBillable), isNonBillable: true }]
            : []),
        ],
      });
      await apiPost(`/site-visits/${visit.id}/complete`, {
        editedBy: 'tech-lars',
      });
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 space-y-3 rounded border border-slate-300 bg-slate-50 p-4">
      <p className="text-sm text-slate-700">
        GPS dwell: <strong>{dwell} min</strong> · Allocated:{' '}
        <strong>{sum} min</strong> · Delta: <strong>{delta} min</strong>{' '}
        (must be ≤ 30)
      </p>
      {orders.map((o) => (
        <label key={o.serviceOrderId} className="flex flex-col gap-1 text-sm">
          <span>
            {o.serviceOrder.customerName} — {o.serviceOrder.address}
          </span>
          <input
            type="number"
            className="rounded border px-2 py-1"
            value={minutes[o.serviceOrderId] ?? 0}
            onChange={(e) =>
              setMinutes((m) => ({
                ...m,
                [o.serviceOrderId]: Number(e.target.value),
              }))
            }
          />
        </label>
      ))}
      <label className="flex flex-col gap-1 text-sm">
        <span>Non-billable / waiting (optional)</span>
        <input
          type="number"
          className="rounded border px-2 py-1"
          value={nonBillable}
          onChange={(e) => setNonBillable(Number(e.target.value))}
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="button"
        disabled={!ok || busy}
        onClick={saveAndComplete}
        className="rounded bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-40"
      >
        {busy ? 'Saving…' : 'Save allocation & complete'}
      </button>
    </div>
  );
}
