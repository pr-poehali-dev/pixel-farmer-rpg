export type GameScreen = 'farm' | 'battle' | 'shop' | 'home' | 'craft';

export interface Player {
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  exp: number;
  expToNext: number;
  gold: number;
  attack: number;
  defense: number;
  speed: number;
  inventory: Item[];
  stats: PlayerStats;
}

export interface PlayerStats {
  farming: number;
  combat: number;
  crafting: number;
  trading: number;
}

export interface Item {
  id: string;
  name: string;
  emoji: string;
  type: 'crop' | 'potion' | 'weapon' | 'armor' | 'material' | 'food';
  value: number;
  effect?: { hp?: number; mp?: number; attack?: number; defense?: number };
  qty: number;
}

export interface Crop {
  id: string;
  name: string;
  emoji: string;
  growTime: number;
  value: number;
  plantedAt?: number;
  stage: 0 | 1 | 2 | 3;
}

export interface FarmCell {
  id: number;
  crop: Crop | null;
  watered: boolean;
  unlocked: boolean;
}

export interface Enemy {
  id: string;
  name: string;
  emoji: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  expReward: number;
  goldReward: number;
  level: number;
}

export interface ShopItem {
  item: Item;
  price: number;
  unlockLevel?: number;
}

export interface CraftRecipe {
  id: string;
  name: string;
  emoji: string;
  result: Item;
  ingredients: { item: Item; qty: number }[];
  requiredLevel: number;
}

export interface HomeUpgrade {
  id: string;
  name: string;
  emoji: string;
  description: string;
  price: number;
  level: number;
  maxLevel: number;
  bonus: string;
  purchased: boolean;
}

export interface BattleState {
  enemy: Enemy | null;
  playerTurn: boolean;
  log: string[];
  combo: number;
  phase: 'idle' | 'fighting' | 'victory' | 'defeat';
  animating: boolean;
}
