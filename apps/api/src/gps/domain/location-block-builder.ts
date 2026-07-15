import { isWithinRadius, LatLng } from './geo';

export type BlockType = 'home' | 'traveled' | 'stationary';

export type BlockDraft = {
  type: BlockType;
  startAt: Date;
  endAt: Date | null;
  center: LatLng;
  status: 'open' | 'closed';
};

function closeBlock(block: BlockDraft, at: Date): BlockDraft {
  return { ...block, status: 'closed', endAt: at };
}

function classifyStationary(
  point: LatLng,
  home: LatLng,
  radius: number,
): BlockType {
  return isWithinRadius(point, home, radius) ? 'home' : 'stationary';
}

export function applyPingToBlocks(args: {
  blocks: BlockDraft[];
  ping: { at: Date; point: LatLng };
  home: LatLng;
  clusterRadiusMeters: number;
}): BlockDraft[] {
  const { ping, home, clusterRadiusMeters: R } = args;
  const blocks = args.blocks.map((b) => ({
    ...b,
    center: { ...b.center },
  }));
  const openIdx = blocks.findIndex((b) => b.status === 'open');

  if (openIdx === -1) {
    const type = classifyStationary(ping.point, home, R);
    blocks.push({
      type,
      startAt: ping.at,
      endAt: null,
      center: ping.point,
      status: 'open',
    });
    return blocks;
  }

  const open = blocks[openIdx];

  if (open.type === 'traveled') {
    blocks[openIdx] = closeBlock(open, ping.at);
    const type = classifyStationary(ping.point, home, R);
    blocks.push({
      type,
      startAt: ping.at,
      endAt: null,
      center: ping.point,
      status: 'open',
    });
    return blocks;
  }

  if (isWithinRadius(ping.point, open.center, R)) {
    return blocks;
  }

  blocks[openIdx] = closeBlock(open, ping.at);
  blocks.push({
    type: 'traveled',
    startAt: ping.at,
    endAt: null,
    center: ping.point,
    status: 'open',
  });
  return blocks;
}
