import { distanceMeters, isWithinRadius } from './geo';

describe('geo', () => {
  it('returns ~0 for same point', () => {
    expect(
      distanceMeters({ lat: 55.67, lng: 12.56 }, { lat: 55.67, lng: 12.56 }),
    ).toBeLessThan(1);
  });

  it('detects point inside 150m radius', () => {
    const center = { lat: 55.68, lng: 12.58 };
    const near = { lat: 55.6805, lng: 12.58 };
    expect(isWithinRadius(near, center, 150)).toBe(true);
  });

  it('detects point outside 150m radius', () => {
    const center = { lat: 55.68, lng: 12.58 };
    const far = { lat: 55.7, lng: 12.58 };
    expect(isWithinRadius(far, center, 150)).toBe(false);
  });
});
