export function StatusChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    scheduled: 'bg-slate-200 text-slate-800',
    arrived: 'bg-sky-100 text-sky-900',
    candidate: 'bg-sky-100 text-sky-900',
    on_site: 'bg-amber-100 text-amber-900',
    confirmed: 'bg-emerald-100 text-emerald-900',
    pending_allocation: 'bg-orange-100 text-orange-900',
    allocated: 'bg-teal-100 text-teal-900',
    completed: 'bg-emerald-200 text-emerald-950',
    queued: 'bg-indigo-100 text-indigo-900',
  };
  return (
    <span className={`chip ${map[status] ?? 'bg-slate-100 text-slate-700'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

export function formatTime(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toISOString().slice(11, 16) + ' UTC';
}

export function mapsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}
