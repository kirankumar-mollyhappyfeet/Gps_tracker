import { isWithinRadius, LatLng } from './geo';

export type DwellState = {
  status: 'none' | 'candidate' | 'on_site' | 'departed';
  inFencePingCount: number;
  arrivedAt?: Date;
  departedAt?: Date;
  dwellMinutes?: number;
  lastInFenceAt?: Date;
};

export function applyFencePing(
  state: DwellState,
  args: {
    at: Date;
    point: LatLng;
    fenceCenter: LatLng;
    radiusMeters: number;
  },
): DwellState {
  const inside = isWithinRadius(
    args.point,
    args.fenceCenter,
    args.radiusMeters,
  );

  if (state.status === 'departed') return state;

  if (inside) {
    if (state.status === 'on_site') {
      return { ...state, lastInFenceAt: args.at };
    }
    const count = state.inFencePingCount + 1;
    if (count === 1) {
      return {
        status: 'candidate',
        inFencePingCount: 1,
        arrivedAt: args.at,
        lastInFenceAt: args.at,
      };
    }
    return {
      status: 'on_site',
      inFencePingCount: count,
      arrivedAt: state.arrivedAt ?? args.at,
      lastInFenceAt: args.at,
    };
  }

  if (state.status === 'candidate') {
    return { status: 'none', inFencePingCount: 0 };
  }
  if (state.status === 'on_site' && state.arrivedAt) {
    const end = state.lastInFenceAt ?? args.at;
    const dwellMinutes = Math.round(
      (end.getTime() - state.arrivedAt.getTime()) / 60000,
    );
    return {
      status: 'departed',
      inFencePingCount: state.inFencePingCount,
      arrivedAt: state.arrivedAt,
      departedAt: end,
      dwellMinutes,
      lastInFenceAt: state.lastInFenceAt,
    };
  }
  return state;
}
