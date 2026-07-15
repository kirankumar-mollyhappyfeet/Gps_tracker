import { validateAllocations } from './allocation';

describe('validateAllocations', () => {
  it('accepts sum within ±30 of dwell', () => {
    const r = validateAllocations({
      dwellMinutes: 120,
      lines: [
        { serviceOrderId: 'a', minutes: 40, isNonBillable: false },
        { serviceOrderId: 'b', minutes: 40, isNonBillable: false },
        { serviceOrderId: 'c', minutes: 30, isNonBillable: false },
        { serviceOrderId: null, minutes: 5, isNonBillable: true },
      ],
      toleranceMinutes: 30,
    });
    expect(r.ok).toBe(true);
  });

  it('rejects when difference exceeds 30', () => {
    const r = validateAllocations({
      dwellMinutes: 120,
      lines: [{ serviceOrderId: 'a', minutes: 50, isNonBillable: false }],
      toleranceMinutes: 30,
    });
    expect(r.ok).toBe(false);
  });

  it('requires at least one line', () => {
    const r = validateAllocations({
      dwellMinutes: 60,
      lines: [],
      toleranceMinutes: 30,
    });
    expect(r.ok).toBe(false);
  });
});
