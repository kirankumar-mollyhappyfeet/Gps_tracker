'use client';

type Block = {
  id: string;
  type: string;
  status: string;
  startAt: string;
  endAt: string | null;
  centerLat: number;
  centerLng: number;
};

const COLORS: Record<string, string> = {
  home: 'bg-emerald-200 border-emerald-500',
  traveled: 'bg-amber-200 border-amber-500',
  stationary: 'bg-sky-200 border-sky-500',
};

export function BlockTimeline({
  blocks,
  onSelect,
}: {
  blocks: Block[];
  onSelect?: (id: string) => void;
}) {
  if (!blocks.length) {
    return <p className="text-sm text-slate-500">No blocks for this day.</p>;
  }

  return (
    <ul className="space-y-2">
      {blocks.map((b) => (
        <li key={b.id}>
          <button
            type="button"
            onClick={() => onSelect?.(b.id)}
            className={`w-full rounded border-l-4 px-3 py-2 text-left ${COLORS[b.type] ?? 'bg-slate-100'}`}
          >
            <div className="font-medium capitalize">{b.type}</div>
            <div className="text-xs text-slate-700">
              {new Date(b.startAt).toISOString().slice(11, 16)} –{' '}
              {b.endAt
                ? new Date(b.endAt).toISOString().slice(11, 16)
                : 'open'}{' '}
              · {b.status}
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
