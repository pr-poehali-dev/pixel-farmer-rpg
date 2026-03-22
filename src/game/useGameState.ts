import { useState, useCallback, useEffect } from 'react';
import { Player, FarmCell, BattleState, HomeUpgrade, Item, GameScreen } from './types';
import { CROPS, HOME_UPGRADES, getRandomEnemy } from './data';

const INITIAL_PLAYER: Player = {
  name: 'Фермер',
  level: 1,
  hp: 80,
  maxHp: 80,
  mp: 40,
  maxMp: 40,
  exp: 0,
  expToNext: 100,
  gold: 50,
  attack: 10,
  defense: 5,
  speed: 8,
  inventory: [],
  stats: { farming: 1, combat: 1, crafting: 1, trading: 1 },
};

const createFarm = (): FarmCell[] =>
  Array.from({ length: 12 }, (_, i) => ({
    id: i,
    crop: null,
    watered: false,
    unlocked: i < 6,
  }));

const INITIAL_BATTLE: BattleState = {
  enemy: null,
  playerTurn: true,
  log: [],
  combo: 0,
  phase: 'idle',
  animating: false,
};

export const useGameState = () => {
  const [screen, setScreen] = useState<GameScreen>('farm');
  const [player, setPlayer] = useState<Player>(INITIAL_PLAYER);
  const [farm, setFarm] = useState<FarmCell[]>(createFarm());
  const [battle, setBattle] = useState<BattleState>(INITIAL_BATTLE);
  const [homeUpgrades, setHomeUpgrades] = useState<HomeUpgrade[]>(HOME_UPGRADES);
  const [selectedCropId, setSelectedCropId] = useState<string>('wheat');
  const [time, setTime] = useState(0);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setTime(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const showNotif = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2500);
  }, []);

  const gainExp = useCallback((amount: number) => {
    setPlayer(p => {
      let newExp = p.exp + amount;
      let newLevel = p.level;
      let newExpToNext = p.expToNext;
      let newMaxHp = p.maxHp;
      let newMaxMp = p.maxMp;
      let newAttack = p.attack;
      let newDefense = p.defense;
      if (newExp >= newExpToNext) {
        newExp -= newExpToNext;
        newLevel += 1;
        newExpToNext = Math.floor(newExpToNext * 1.5);
        newMaxHp += 15;
        newMaxMp += 8;
        newAttack += 2;
        newDefense += 1;
        showNotif(`🎉 Уровень ${newLevel}! Герой стал сильнее!`);
      }
      return {
        ...p,
        exp: newExp,
        level: newLevel,
        expToNext: newExpToNext,
        maxHp: newMaxHp,
        maxMp: newMaxMp,
        hp: Math.min(p.hp + 10, newMaxHp),
        attack: newAttack,
        defense: newDefense,
      };
    });
  }, [showNotif]);

  const plantCrop = useCallback((cellId: number) => {
    const cropTemplate = CROPS.find(c => c.id === selectedCropId);
    if (!cropTemplate) return;
    setFarm(f => f.map(cell => {
      if (cell.id !== cellId || !cell.unlocked || cell.crop) return cell;
      return { ...cell, crop: { ...cropTemplate, plantedAt: time, stage: 1 }, watered: false };
    }));
  }, [selectedCropId, time]);

  const waterCrop = useCallback((cellId: number) => {
    setFarm(f => f.map(cell => {
      if (cell.id !== cellId || !cell.crop) return cell;
      return { ...cell, watered: true };
    }));
  }, []);

  const harvestCrop = useCallback((cellId: number) => {
    setFarm(f => {
      const cell = f.find(c => c.id === cellId);
      if (!cell?.crop) return f;
      const crop = cell.crop;
      const elapsed = time - (crop.plantedAt || 0);
      const readyIn = crop.watered ? crop.growTime * 0.7 : crop.growTime;
      if (elapsed < readyIn) return f;
      setPlayer(p => {
        const existing = p.inventory.find(i => i.id === crop.id);
        const newInventory = existing
          ? p.inventory.map(i => i.id === crop.id ? { ...i, qty: i.qty + 1 } : i)
          : [...p.inventory, { id: crop.id, name: crop.name, emoji: crop.emoji, type: 'crop' as const, value: crop.value, qty: 1 }];
        return { ...p, inventory: newInventory };
      });
      gainExp(crop.value);
      showNotif(`+1 ${crop.emoji} ${crop.name}`);
      return f.map(c => c.id === cellId ? { ...c, crop: null, watered: false } : c);
    });
  }, [time, gainExp, showNotif]);

  const getCropStage = useCallback((cell: FarmCell): number => {
    if (!cell.crop) return 0;
    const elapsed = time - (cell.crop.plantedAt || 0);
    const total = cell.crop.watered ? cell.crop.growTime * 0.7 : cell.crop.growTime;
    if (elapsed >= total) return 3;
    if (elapsed >= total * 0.6) return 2;
    if (elapsed >= total * 0.2) return 1;
    return 1;
  }, [time]);

  const startBattle = useCallback(() => {
    const enemy = getRandomEnemy(player.level);
    setBattle({ enemy: { ...enemy }, playerTurn: true, log: [`⚔️ Появился ${enemy.name}!`], combo: 0, phase: 'fighting', animating: false });
    setScreen('battle');
  }, [player.level]);

  const playerAttack = useCallback((type: 'normal' | 'heavy' | 'magic') => {
    setBattle(b => {
      if (!b.enemy || !b.playerTurn || b.animating) return b;
      let damage = 0;
      let mpCost = 0;
      let logMsg = '';
      const newCombo = type === 'normal' ? b.combo + 1 : 0;
      const comboBonus = Math.floor(newCombo * 1.5);
      if (type === 'normal') {
        damage = Math.max(1, player.attack - b.enemy.defense + comboBonus + Math.floor(Math.random() * 4));
        logMsg = newCombo > 2 ? `⚡ КОМБО x${newCombo}! Урон: ${damage}` : `🗡️ Удар! Урон: ${damage}`;
      } else if (type === 'heavy') {
        damage = Math.max(1, player.attack * 2 - b.enemy.defense + Math.floor(Math.random() * 6));
        logMsg = `💥 Тяжёлый удар! Урон: ${damage}`;
      } else if (type === 'magic') {
        if (player.mp < 10) return b;
        damage = Math.max(1, player.attack * 1.5 + 5 + Math.floor(Math.random() * 8));
        mpCost = 10;
        logMsg = `✨ Магия! Урон: ${damage}`;
      }
      const newHp = b.enemy.hp - damage;
      if (mpCost > 0) setPlayer(p => ({ ...p, mp: Math.max(0, p.mp - mpCost) }));
      if (newHp <= 0) {
        gainExp(b.enemy.expReward);
        setPlayer(p => ({ ...p, gold: p.gold + b.enemy!.goldReward }));
        return { ...b, enemy: { ...b.enemy, hp: 0 }, log: [...b.log, logMsg, `🏆 Победа! +${b.enemy.expReward} EXP, +${b.enemy.goldReward} 🪙`], combo: newCombo, phase: 'victory', playerTurn: false };
      }
      return { ...b, enemy: { ...b.enemy, hp: newHp }, log: [...b.log, logMsg].slice(-6), combo: newCombo, playerTurn: false, animating: true };
    });
  }, [player.attack, player.mp, gainExp]);

  useEffect(() => {
    if (!battle.animating || battle.phase !== 'fighting') return;
    const timer = setTimeout(() => {
      setBattle(b => {
        if (!b.enemy) return b;
        const damage = Math.max(1, b.enemy.attack - player.defense + Math.floor(Math.random() * 4));
        const logMsg = `👹 ${b.enemy.name} атакует! Урон: ${damage}`;
        const newHp = player.hp - damage;
        if (newHp <= 0) {
          setPlayer(p => ({ ...p, hp: 1 }));
          return { ...b, log: [...b.log, logMsg, '💀 Поражение...'].slice(-6), phase: 'defeat', playerTurn: false, animating: false };
        }
        setPlayer(p => ({ ...p, hp: Math.max(1, p.hp - damage) }));
        return { ...b, log: [...b.log, logMsg].slice(-6), playerTurn: true, animating: false };
      });
    }, 800);
    return () => clearTimeout(timer);
  }, [battle.animating, battle.phase, player.defense, player.hp]);

  const useItem = useCallback((itemId: string) => {
    setPlayer(p => {
      const item = p.inventory.find(i => i.id === itemId);
      if (!item || item.type !== 'potion' || !item.effect) return p;
      const newPlayer = { ...p };
      if (item.effect.hp) newPlayer.hp = Math.min(p.hp + item.effect.hp, p.maxHp);
      if (item.effect.mp) newPlayer.mp = Math.min(p.mp + item.effect.mp, p.maxMp);
      if (item.effect.attack) newPlayer.attack = p.attack + item.effect.attack;
      const newInv = p.inventory.map(i =>
        i.id === itemId ? { ...i, qty: i.qty - 1 } : i
      ).filter(i => i.qty > 0);
      showNotif(`Использовано: ${item.emoji} ${item.name}`);
      return { ...newPlayer, inventory: newInv };
    });
  }, [showNotif]);

  const buyItem = useCallback((item: Item, price: number) => {
    setPlayer(p => {
      if (p.gold < price) { showNotif('Недостаточно золота!'); return p; }
      const existing = p.inventory.find(i => i.id === item.id);
      const newInventory = existing
        ? p.inventory.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i)
        : [...p.inventory, { ...item, qty: 1 }];
      showNotif(`Куплено: ${item.emoji} ${item.name}`);
      return { ...p, gold: p.gold - price, inventory: newInventory };
    });
  }, [showNotif]);

  const sellItem = useCallback((itemId: string) => {
    setPlayer(p => {
      const item = p.inventory.find(i => i.id === itemId);
      if (!item) return p;
      const newInv = p.inventory.map(i =>
        i.id === itemId ? { ...i, qty: i.qty - 1 } : i
      ).filter(i => i.qty > 0);
      showNotif(`Продано: ${item.emoji} +${item.value} 🪙`);
      return { ...p, gold: p.gold + item.value, inventory: newInv };
    });
  }, [showNotif]);

  const upgradeHome = useCallback((upgradeId: string) => {
    const upgrade = homeUpgrades.find(u => u.id === upgradeId);
    if (!upgrade || upgrade.level >= upgrade.maxLevel) return;
    const price = upgrade.price * (upgrade.level + 1);
    if (player.gold < price) { showNotif('Недостаточно золота!'); return; }
    setPlayer(p => {
      const newPlayer = { ...p, gold: p.gold - price };
      if (upgradeId === 'bed') newPlayer.maxHp += 20;
      if (upgradeId === 'forge') newPlayer.attack += 3;
      return newPlayer;
    });
    setHomeUpgrades(ups => ups.map(u =>
      u.id === upgradeId ? { ...u, level: u.level + 1, purchased: true } : u
    ));
    showNotif(`✅ ${upgrade.emoji} ${upgrade.name} улучшен!`);
  }, [homeUpgrades, player.gold, showNotif]);

  const craftItem = useCallback((recipeId: string, recipe: import('./types').CraftRecipe) => {
    setPlayer(p => {
      for (const ing of recipe.ingredients) {
        const have = p.inventory.find(i => i.id === ing.item.id);
        if (!have || have.qty < ing.qty) {
          showNotif(`Не хватает: ${ing.item.emoji} ${ing.item.name}`);
          return p;
        }
      }
      let newInv = [...p.inventory];
      for (const ing of recipe.ingredients) {
        newInv = newInv.map(i => i.id === ing.item.id ? { ...i, qty: i.qty - ing.qty } : i).filter(i => i.qty > 0);
      }
      const existing = newInv.find(i => i.id === recipe.result.id);
      if (existing) {
        newInv = newInv.map(i => i.id === recipe.result.id ? { ...i, qty: i.qty + 1 } : i);
      } else {
        newInv = [...newInv, { ...recipe.result, qty: 1 }];
      }
      showNotif(`⚗️ Создано: ${recipe.emoji} ${recipe.name}`);
      gainExp(15);
      return { ...p, inventory: newInv };
    });
  }, [showNotif, gainExp]);

  const fleeFromBattle = useCallback(() => {
    setBattle(INITIAL_BATTLE);
    setScreen('farm');
    showNotif('Ты сбежал с поля боя!');
  }, [showNotif]);

  const exitBattle = useCallback(() => {
    setBattle(INITIAL_BATTLE);
    setScreen('farm');
  }, []);

  return {
    screen, setScreen,
    player, setPlayer,
    farm, setFarm,
    battle, setBattle,
    homeUpgrades,
    selectedCropId, setSelectedCropId,
    time,
    notification,
    plantCrop, waterCrop, harvestCrop,
    getCropStage,
    startBattle, playerAttack, fleeFromBattle, exitBattle,
    useItem, buyItem, sellItem,
    upgradeHome,
    craftItem,
  };
};
