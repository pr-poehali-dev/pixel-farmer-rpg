export const TILE_SIZE = 32;

export enum Tile {
  AIR = 0,
  GRASS = 1,
  DIRT = 2,
  STONE = 3,
  DEEP_STONE = 4,
  WOOD = 5,
  LEAVES = 6,
  WATER = 7,
  SAND = 8,
  ORE_COAL = 9,
  ORE_IRON = 10,
  ORE_GOLD = 11,
  CHEST = 12,
  TORCH = 13,
}

export interface TileData {
  solid: boolean;
  color: string;
  top?: string;
  label?: string;
  breakable?: boolean;
  drops?: string;
  light?: number;
}

export const TILE_DEFS: Record<Tile, TileData> = {
  [Tile.AIR]:       { solid: false, color: 'transparent' },
  [Tile.GRASS]:     { solid: true,  color: '#5d4037', top: '#4caf50', breakable: true, drops: 'dirt' },
  [Tile.DIRT]:      { solid: true,  color: '#795548', breakable: true, drops: 'dirt' },
  [Tile.STONE]:     { solid: true,  color: '#616161', breakable: true, drops: 'stone' },
  [Tile.DEEP_STONE]:{ solid: true,  color: '#424242', breakable: true, drops: 'stone' },
  [Tile.WOOD]:      { solid: true,  color: '#6d4c41', breakable: true, drops: 'wood' },
  [Tile.LEAVES]:    { solid: false, color: '#388e3c', breakable: true },
  [Tile.WATER]:     { solid: false, color: '#1565c088' },
  [Tile.SAND]:      { solid: true,  color: '#f9a825', breakable: true },
  [Tile.ORE_COAL]:  { solid: true,  color: '#616161', breakable: true, drops: 'coal', label: '◆' },
  [Tile.ORE_IRON]:  { solid: true,  color: '#8d6e63', breakable: true, drops: 'iron', label: '◆' },
  [Tile.ORE_GOLD]:  { solid: true,  color: '#757575', breakable: true, drops: 'gold', label: '◆', light: 0.2 },
  [Tile.CHEST]:     { solid: true,  color: '#a0522d', breakable: false, label: '📦' },
  [Tile.TORCH]:     { solid: false, color: 'transparent', label: '🔥', light: 0.9, breakable: true },
};

export const isSolid = (tile: Tile) => TILE_DEFS[tile]?.solid ?? false;
