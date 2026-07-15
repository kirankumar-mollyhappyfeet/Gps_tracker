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
  const dwell = visit.dwellMinutes ?? 0;
  const [minutes, setMinutes] = useState<Record<string, number>>(() => {
    const even = Math.floor(dwell / Math.max(orders.length, 1));
    const init: Record<string, number> = {};
    orders.forEach((o, i) => {
      init[o.serviceOrderId] =
        i === orders.length - 1 ? dwell - even * (orders.length - 1) : even;
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
    <div className="mt-4 space-y-3 rounded-xl border border-[var(--line)] bg-[var(--accent-soft)]/40 p-4">
      <div>
        <p className="font-display text-lg">Split time across orders</p>
        <p className="text-sm text-[var(--muted)]">
          GPS recorded <strong>{dwell} min</strong> on site. Allocate each
          apartment/job (sum within ±30 min).
        </p>
      </div>
      <p className="text-sm">
        Allocated <strong>{sum}</strong> · delta <strong>{delta}</strong> min{' '}
        {ok ? '✓' : '(too far from dwell)'}
      </p>
      {orders.map((o) => (
        <label key={o.serviceOrderId} className="block text-sm">
          <span className="font-medium">{o.serviceOrder.customerName}</span>
          <span className="block text-xs text-[var(--muted)]">
            {o.serviceOrder.address}
          </span>
          <input
            type="number"
            className="field mt-1"
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
      <label className="block text-sm">
        Non-billable / waiting (optional)
        <input
          type="number"
          className="field mt-1"
          value={nonBillable}
          onChange={(e) => setNonBillable(Number(e.target.value))}
        />
      </label>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button
        type="button"
        className="btn btn-accent"
        disabled={!ok || busy}
        onClick={saveAndComplete}
      >
        {busy ? 'Saving…' : 'Save split & complete visit'}
      </button>
    </div>
  );
}
