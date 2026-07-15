import { applyFencePing, DwellState } from './site-visit-dwell';

const fence = { lat: 55.68, lng: 12.58 };
const inside = { lat: 55.6802, lng: 12.58 };
const outside = { lat: 55.7, lng: 12.58 };

describe('applyFencePing', () => {
  it('stays candidate after first in-fence ping', () => {
    let s: DwellState = { status: 'none', inFencePingCount: 0 };
    s = applyFencePing(s, {
      at: new Date('2026-07-15T09:00:00Z'),
      point: inside,
      fenceCenter: fence,
      radiusMeters: 150,
    });
    expect(s.status).toBe('candidate');
    expect(s.inFencePingCount).toBe(1);
  });

  it('confirms on_site after second consecutive in-fence ping', () => {
    let s: DwellState = { status: 'none', inFencePingCount: 0 };
    s = applyFencePing(s, {
      at: new Date('2026-07-15T09:00:00Z'),
      point: inside,
      fenceCenter: fence,
      radiusMeters: 150,
    });
    s = applyFencePing(s, {
      at: new Date('2026-07-15T09:15:00Z'),
      point: inside,
      fenceCenter: fence,
      radiusMeters: 150,
    });
    expect(s.status).toBe('on_site');
    expect(s.arrivedAt).toEqual(new Date('2026-07-15T09:00:00Z'));
  });

  it('drive-by does not confirm', () => {
    let s: DwellState = { status: 'none', inFencePingCount: 0 };
    s = applyFencePing(s, {
      at: new Date('2026-07-15T09:00:00Z'),
      point: inside,
      fenceCenter: fence,
      radiusMeters: 150,
    });
    s = applyFencePing(s, {
      at: new Date('2026-07-15T09:15:00Z'),
      point: outside,
      fenceCenter: fence,
      radiusMeters: 150,
    });
    expect(s.status).toBe('none');
  });

  it('sets departed and dwellMinutes on leave after on_site', () => {
    let s: DwellState = { status: 'none', inFencePingCount: 0 };
    s = applyFencePing(s, {
      at: new Date('2026-07-15T09:00:00Z'),
      point: inside,
      fenceCenter: fence,
      radiusMeters: 150,
    });
    s = applyFencePing(s, {
      at: new Date('2026-07-15T09:15:00Z'),
      point: inside,
      fenceCenter: fence,
      radiusMeters: 150,
    });
    s = applyFencePing(s, {
      at: new Date('2026-07-15T11:00:00Z'),
      point: outside,
      fenceCenter: fence,
      radiusMeters: 150,
    });
    expect(s.status).toBe('departed');
    expect(s.departedAt).toEqual(new Date('2026-07-15T09:15:00Z'));
    expect(s.dwellMinutes).toBe(15);
  });
});
