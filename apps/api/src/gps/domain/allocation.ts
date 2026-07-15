export type AllocationLine = {
  serviceOrderId: string | null;
  minutes: number;
  isNonBillable: boolean;
};

export function validateAllocations(args: {
  dwellMinutes: number;
  lines: AllocationLine[];
  toleranceMinutes?: number;
}): { ok: true } | { ok: false; error: string } {
  const tolerance = args.toleranceMinutes ?? 30;
  if (args.lines.length === 0) {
    return { ok: false, error: 'At least one allocation line is required' };
  }
  for (const line of args.lines) {
    if (!Number.isFinite(line.minutes) || line.minutes < 0) {
      return { ok: false, error: 'Minutes must be a non-negative number' };
    }
    if (!line.isNonBillable && !line.serviceOrderId) {
      return { ok: false, error: 'Billable lines require serviceOrderId' };
    }
  }
  const sum = args.lines.reduce((s, l) => s + l.minutes, 0);
  const delta = Math.abs(sum - args.dwellMinutes);
  if (delta > tolerance) {
    return {
      ok: false,
      error: `Allocation sum ${sum} must be within ±${tolerance} minutes of dwell ${args.dwellMinutes} (delta ${delta})`,
    };
  }
  return { ok: true };
}
