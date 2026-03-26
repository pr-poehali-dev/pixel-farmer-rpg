import { Crop, Item, ShopItem, CraftRecipe, HomeUpgrade, Enemy } from './types';

export const CROPS: Crop[] = [
  { id: 'wheat', name: 'Пшеница', emoji: '🌾', growTime: 10, value: 5, stage: 0 },
  { id: 'carrot', name: 'Морковь', emoji: '🥕', growTime: 20, value: 12, stage: 0 },
  { id: 'pumpkin', name: 'Тыква', emoji: '🎃', growTime: 40, value: 30, stage: 0 },
  { id: 'berry', name: 'Ягоды', emoji: '🍓', growTime: 15, value: 18, stage: 0 },
  { id: 'mushroom', name: 'Гриб', emoji: '🍄', growTime: 30, value: 25, stage: 0 },
  { id: 'herb', name: 'Трава', emoji: '🌿', growTime: 12, value: 8, stage: 0 },
];

export const ITEMS: Record<string, Item> = {
  wheat: { id: 'wheat', name: 'Пшеница', emoji: '🌾', type: 'crop', value: 5, qty: 0 },
  carrot: { id: 'carrot', name: 'Морковь', emoji: '🥕', type: 'crop', value: 12, qty: 0 },
  pumpkin: { id: 'pumpkin', name: 'Тыква', emoji: '🎃', type: 'crop', value: 30, qty: 0 },
  berry: { id: 'berry', name: 'Ягоды', emoji: '🍓', type: 'crop', value: 18, qty: 0 },
  mushroom: { id: 'mushroom', name: 'Гриб', emoji: '🍄', type: 'crop', value: 25, qty: 0 },
  herb: { id: 'herb', name: 'Трава', emoji: '🌿', type: 'crop', value: 8, qty: 0 },
  healPotion: { id: 'healPotion', name: 'Зелье HP', emoji: '🧪', type: 'potion', value: 20, effect: { hp: 30 }, qty: 0 },
  mpPotion: { id: 'mpPotion', name: 'Зелье MP', emoji: '💙', type: 'potion', value: 25, effect: { mp: 20 }, qty: 0 },
  strongPotion: { id: 'strongPotion', name: 'Зелье силы', emoji: '⚗️', type: 'potion', value: 50, effect: { attack: 5 }, qty: 0 },
  woodSword: { id: 'woodSword', name: 'Дерев. меч', emoji: '🗡️', type: 'weapon', value: 30, effect: { attack: 3 }, qty: 0 },
  ironSword: { id: 'ironSword', name: 'Железный меч', emoji: '⚔️', type: 'weapon', value: 80, effect: { attack: 7 }, qty: 0 },
  leather: { id: 'leather', name: 'Кожа', emoji: '🧶', type: 'material', value: 10, qty: 0 },
  bone: { id: 'bone', name: 'Кость', emoji: '🦴', type: 'material', value: 8, qty: 0 },
  crystal: { id: 'crystal', name: 'Кристалл', emoji: '💎', type: 'material', value: 40, qty: 0 },
};

export const SHOP_ITEMS: ShopItem[] = [
  { item: { ...ITEMS.healPotion }, price: 20 },
  { item: { ...ITEMS.mpPotion }, price: 25 },
  { item: { ...ITEMS.strongPotion }, price: 50, unlockLevel: 3 },
  { item: { ...ITEMS.woodSword }, price: 40 },
  { item: { ...ITEMS.ironSword }, price: 100, unlockLevel: 5 },
  { item: { ...ITEMS.leather }, price: 10 },
  { item: { ...ITEMS.crystal }, price: 50, unlockLevel: 4 },
];

export const CRAFT_RECIPES: CraftRecipe[] = [
  {
    id: 'healPotion',
    name: 'Зелье HP',
    emoji: '🧪',
    result: { ...ITEMS.healPotion, qty: 1 },
    ingredients: [
      { item: { ...ITEMS.herb, qty: 2 }, qty: 2 },
      { item: { ...ITEMS.berry, qty: 1 }, qty: 1 },
    ],
    requiredLevel: 1,
  },
  {
    id: 'mpPotion',
    name: 'Зелье MP',
    emoji: '💙',
    result: { ...ITEMS.mpPotion, qty: 1 },
    ingredients: [
      { item: { ...ITEMS.mushroom, qty: 2 }, qty: 2 },
      { item: { ...ITEMS.crystal, qty: 1 }, qty: 1 },
    ],
    requiredLevel: 2,
  },
  {
    id: 'strongPotion',
    name: 'Зелье силы',
    emoji: '⚗️',
    result: { ...ITEMS.strongPotion, qty: 1 },
    ingredients: [
      { item: { ...ITEMS.herb, qty: 3 }, qty: 3 },
      { item: { ...ITEMS.crystal, qty: 2 }, qty: 2 },
      { item: { ...ITEMS.mushroom, qty: 1 }, qty: 1 },
    ],
    requiredLevel: 3,
  },
];

export const HOME_UPGRADES: HomeUpgrade[] = [
  { id: 'bed', name: 'Кровать', emoji: '🛏️', description: '+20% к регену HP', price: 60, level: 0, maxLevel: 3, bonus: '+20 max HP', purchased: false },
  { id: 'kitchen', name: 'Кухня', emoji: '🍳', description: '+1 слот крафта', price: 80, level: 0, maxLevel: 2, bonus: 'Крафт x2', purchased: false },
  { id: 'garden', name: 'Огород', emoji: '🌱', description: '+2 клетки фермы', price: 100, level: 0, maxLevel: 3, bonus: '+2 ячейки', purchased: false },
  { id: 'forge', name: 'Кузница', emoji: '⚒️', description: '+3 атаки', price: 150, level: 0, maxLevel: 2, bonus: '+3 ATK', purchased: false },
  { id: 'library', name: 'Библиотека', emoji: '📚', description: '+2 слота зелий', price: 120, level: 0, maxLevel: 2, bonus: '+10% EXP', purchased: false },
];

export const ENEMIES: Enemy[] = [
  { id: 'slime', name: 'Слизень', emoji: '🟢', hp: 20, maxHp: 20, attack: 3, defense: 1, expReward: 10, goldReward: 5, level: 1 },
  { id: 'rat', name: 'Крыса', emoji: '🐀', hp: 15, maxHp: 15, attack: 5, defense: 0, expReward: 8, goldReward: 4, level: 1 },
  { id: 'goblin', name: 'Гоблин', emoji: '👺', hp: 35, maxHp: 35, attack: 8, defense: 3, expReward: 20, goldReward: 12, level: 2 },
  { id: 'wolf', name: 'Волк', emoji: '🐺', hp: 50, maxHp: 50, attack: 12, defense: 4, expReward: 30, goldReward: 18, level: 3 },
  { id: 'troll', name: 'Тролль', emoji: '👹', hp: 80, maxHp: 80, attack: 18, defense: 8, expReward: 50, goldReward: 30, level: 4 },
  { id: 'dragon', name: 'Дракон', emoji: '🐉', hp: 150, maxHp: 150, attack: 30, defense: 15, expReward: 100, goldReward: 80, level: 6 },
];

export const getEnemiesForLevel = (playerLevel: number): Enemy[] => {
  return ENEMIES.filter(e => e.level <= playerLevel + 1 && e.level >= Math.max(1, playerLevel - 1));
};

export const getRandomEnemy = (playerLevel: number): Enemy => {
  const pool = getEnemiesForLevel(playerLevel);
  const base = pool[Math.floor(Math.random() * pool.length)];
  const scale = 1 + (playerLevel - base.level) * 0.15;
  return {
    ...base,
    hp: Math.floor(base.maxHp * scale),
    maxHp: Math.floor(base.maxHp * scale),
    attack: Math.floor(base.attack * scale),
    defense: Math.floor(base.defense * scale),
    expReward: Math.floor(base.expReward * scale),
    goldReward: Math.floor(base.goldReward * scale),
  };
};
