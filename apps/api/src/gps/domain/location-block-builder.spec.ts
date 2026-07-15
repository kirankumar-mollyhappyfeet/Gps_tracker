import { applyPingToBlocks, BlockDraft } from './location-block-builder';

const home = { lat: 55.6761, lng: 12.5683 };
const client = { lat: 55.68, lng: 12.58 };
const R = 150;

function at(h: number, m: number) {
  return new Date(
    `2026-07-15T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00.000Z`,
  );
}

describe('applyPingToBlocks', () => {
  it('merges same-place pings into one home block across long gaps', () => {
    let blocks: BlockDraft[] = [];
    blocks = applyPingToBlocks({
      blocks,
      ping: { at: at(6, 0), point: home },
      home,
      clusterRadiusMeters: R,
    });
    blocks = applyPingToBlocks({
      blocks,
      ping: { at: at(8, 0), point: home },
      home,
      clusterRadiusMeters: R,
    });
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('home');
    expect(blocks[0].status).toBe('open');
    expect(blocks[0].startAt).toEqual(at(6, 0));
  });

  it('opens traveled then stationary when moving home → client', () => {
    let blocks: BlockDraft[] = [];
    blocks = applyPingToBlocks({
      blocks,
      ping: { at: at(8, 0), point: home },
      home,
      clusterRadiusMeters: R,
    });
    blocks = applyPingToBlocks({
      blocks,
      ping: { at: at(8, 15), point: { lat: 55.678, lng: 12.574 } },
      home,
      clusterRadiusMeters: R,
    });
    blocks = applyPingToBlocks({
      blocks,
      ping: { at: at(9, 0), point: client },
      home,
      clusterRadiusMeters: R,
    });
    blocks = applyPingToBlocks({
      blocks,
      ping: { at: at(9, 15), point: client },
      home,
      clusterRadiusMeters: R,
    });
    const types = blocks.map((b) => b.type);
    expect(types).toEqual(['home', 'traveled', 'stationary']);
    expect(blocks[0].status).toBe('closed');
    expect(blocks[1].status).toBe('closed');
    expect(blocks[2].status).toBe('open');
  });
});
