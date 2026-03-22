import { Tile } from './tiles';

export const WORLD_W = 256;
export const WORLD_H = 128;
export const SEA_LEVEL = 40;

function noise(x: number, seed: number) {
  const s = Math.sin(x * 127.1 + seed * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function smoothNoise(x: number, seed: number) {
  return (
    noise(x - 1, seed) * 0.25 +
    noise(x, seed) * 0.5 +
    noise(x + 1, seed) * 0.25
  );
}

function octaveNoise(x: number, seed: number, octaves = 4) {
  let v = 0, amp = 1, freq = 1, max = 0;
  for (let i = 0; i < octaves; i++) {
    v += smoothNoise(x * freq, seed + i * 100) * amp;
    max += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return v / max;
}

export function generateWorld(): Uint8Array {
  const seed = Math.floor(Math.random() * 10000);
  const world = new Uint8Array(WORLD_W * WORLD_H);
  const idx = (x: number, y: number) => y * WORLD_W + x;
  const set = (x: number, y: number, t: Tile) => {
    if (x >= 0 && x < WORLD_W && y >= 0 && y < WORLD_H) world[idx(x, y)] = t;
  };
  const get = (x: number, y: number): Tile => {
    if (x < 0 || x >= WORLD_W || y < 0 || y >= WORLD_H) return Tile.STONE;
    return world[idx(x, y)] as Tile;
  };

  // Surface heights
  const heights: number[] = [];
  for (let x = 0; x < WORLD_W; x++) {
    const h = Math.floor(SEA_LEVEL + octaveNoise(x * 0.03, seed) * 18 - 9);
    heights[x] = Math.max(5, Math.min(WORLD_H - 20, h));
  }

  // Fill terrain
  for (let x = 0; x < WORLD_W; x++) {
    const surface = heights[x];
    for (let y = 0; y < WORLD_H; y++) {
      if (y < surface) {
        set(x, y, Tile.AIR);
      } else if (y === surface) {
        set(x, y, Tile.GRASS);
      } else if (y < surface + 5) {
        set(x, y, Tile.DIRT);
      } else if (y < surface + 30) {
        set(x, y, Tile.STONE);
      } else {
        set(x, y, Tile.DEEP_STONE);
      }
    }
  }

  // Caves
  for (let i = 0; i < 80; i++) {
    let cx = Math.floor(Math.random() * WORLD_W);
    let cy = Math.floor(heights[cx] + 15 + Math.random() * 40);
    const len = 30 + Math.floor(Math.random() * 60);
    for (let s = 0; s < len; s++) {
      const r = 2 + Math.floor(Math.random() * 3);
      for (let dy = -r; dy <= r; dy++)
        for (let dx = -r; dx <= r; dx++)
          if (dx * dx + dy * dy <= r * r) set(cx + dx, cy + dy, Tile.AIR);
      cx += Math.floor(Math.random() * 5) - 2;
      cy += Math.floor(Math.random() * 3) - 1;
    }
  }

  // Ores
  const oreTypes: [Tile, number, number, number][] = [
    [Tile.ORE_COAL,  120, 5,  10],
    [Tile.ORE_IRON,  80,  10, 8],
    [Tile.ORE_GOLD,  40,  30, 5],
  ];
  for (const [tile, count, minDepth, clusterSize] of oreTypes) {
    for (let i = 0; i < count; i++) {
      const x = Math.floor(Math.random() * WORLD_W);
      const baseSurface = heights[x];
      const y = baseSurface + minDepth + Math.floor(Math.random() * 20);
      for (let j = 0; j < clusterSize; j++) {
        const ox = x + Math.floor(Math.random() * 5) - 2;
        const oy = y + Math.floor(Math.random() * 5) - 2;
        if (get(ox, oy) === Tile.STONE || get(ox, oy) === Tile.DEEP_STONE) {
          set(ox, oy, tile);
        }
      }
    }
  }

  // Trees
  for (let x = 3; x < WORLD_W - 3; x++) {
    if (get(x, heights[x]) === Tile.GRASS && Math.random() < 0.08) {
      const trunkH = 4 + Math.floor(Math.random() * 4);
      const base = heights[x];
      for (let t = 1; t <= trunkH; t++) set(x, base - t, Tile.WOOD);
      const top = base - trunkH;
      for (let dy = -3; dy <= 1; dy++)
        for (let dx = -3; dx <= 3; dx++)
          if (Math.abs(dx) + Math.abs(dy) < 5 && get(x + dx, top + dy) === Tile.AIR)
            set(x + dx, top + dy, Tile.LEAVES);
    }
  }

  // Water pools
  for (let i = 0; i < 15; i++) {
    const wx = Math.floor(Math.random() * WORLD_W);
    const wy = heights[wx] + 1;
    if (get(wx, wy - 1) === Tile.GRASS) {
      for (let dx = -4; dx <= 4; dx++) {
        set(wx + dx, wy, Tile.WATER);
      }
    }
  }

  // Chests in caves
  for (let i = 0; i < 8; i++) {
    const cx = Math.floor(Math.random() * WORLD_W);
    const cy = Math.floor(heights[cx] + 10 + Math.random() * 30);
    if (get(cx, cy) === Tile.AIR && get(cx, cy + 1) !== Tile.AIR) {
      set(cx, cy, Tile.CHEST);
    }
  }

  return world;
}
