const STYLE: Record<string, string> = {
  scheduled: 'bg-slate-200 text-slate-800',
  arrived: 'bg-sky-100 text-sky-900',
  candidate: 'bg-sky-100 text-sky-900',
  on_site: 'bg-amber-100 text-amber-900',
  confirmed: 'bg-emerald-100 text-emerald-900',
  pending_allocation: 'bg-orange-100 text-orange-900',
  allocated: 'bg-teal-100 text-teal-900',
  completed: 'bg-emerald-200 text-emerald-950',
  queued: 'bg-indigo-100 text-indigo-900',
  departed: 'bg-slate-200 text-slate-800',
};

/** Human labels — avoid raw snake_case looking like "pending assigned". */
const LABEL: Record<string, string> = {
  scheduled: 'Assigned',
  arrived: 'Arrived',
  candidate: 'Approaching',
  on_site: 'On site',
  confirmed: 'Ready to approve',
  pending_allocation: 'Needs time split',
  allocated: 'Allocated',
  completed: 'Completed',
  queued: 'Sync queued',
  departed: 'Departed',
};

export function StatusChip({ status }: { status: string }) {
  return (
    <span className={`chip ${STYLE[status] ?? 'bg-slate-100 text-slate-700'}`}>
      {LABEL[status] ?? status.replace(/_/g, ' ')}
    </span>
  );
}
