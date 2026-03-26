import { useEffect, useRef, useState, useCallback } from 'react';
import { generateWorld, WORLD_W, SEA_LEVEL } from '@/engine/worldgen';
import { Tile, TILE_SIZE, TILE_DEFS } from '@/engine/tiles';
import { createPlayer, updatePlayer, gainExp as doGainExp, restoreStamina, Player } from '@/engine/player';
import { Enemy, spawnEnemy, updateEnemies, hitEnemy } from '@/engine/enemies';
import { Particle, spawnParticles, updateParticles } from '@/engine/particles';
import { renderWorld } from '@/engine/renderer';
import { JoystickState, createJoystick, drawJoystick, drawActionButtons } from '@/engine/controls';

const TILE_COLORS: Record<number, string> = {
  [Tile.GRASS]: '#4caf50', [Tile.DIRT]: '#795548', [Tile.STONE]: '#9e9e9e',
  [Tile.WOOD]: '#6d4c41',  [Tile.ORE_COAL]: '#212121', [Tile.ORE_IRON]: '#bf8860',
  [Tile.ORE_GOLD]: '#ffd600',
};

const SLOT_COLORS: Record<string, string> = {
  dirt: '#795548', stone: '#616161', wood: '#6d4c41',
  coal: '#212121', iron: '#90a4ae', gold: '#ffd600',
};

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef  = useRef<{
    world: Uint8Array;
    player: Player;
    enemies: Enemy[];
    particles: Particle[];
    keys: Set<string>;
    joystick: JoystickState;
    joystickTouchId: number | null;
    actionTouchIds: Map<string, number>;
    inventory: Record<string, number>;
    selectedSlot: string;
    jumpPressed: boolean;
    attackPressed: boolean;
    placePressed: boolean;
    heavyPressed: boolean;
    frameId: number;
    time: number;
    notification: { text: string; timer: number } | null;
    enemySpawnTimer: number;
  } | null>(null);
  const [ready, setReady] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [showSleep, setShowSleep] = useState(false);
  const [showSleepScreen, setShowSleepScreen] = useState(false);

  const showNotif = useCallback((text: string) => {
    setNotification(text);
    setTimeout(() => setNotification(null), 2200);
  }, []);

  useEffect(() => {
    const world = generateWorld();

    // Find spawn point
    const spawnX = Math.floor(WORLD_W / 2);
    let spawnY = SEA_LEVEL - 5;
    for (let y = 0; y < 128; y++) {
      if ((world[y * WORLD_W + spawnX] as Tile) !== Tile.AIR) {
        spawnY = y - 3;
        break;
      }
    }

    const player = createPlayer(spawnX * TILE_SIZE, spawnY * TILE_SIZE);
    const keys = new Set<string>();

    // Spawn initial enemies nearby
    const enemies: Enemy[] = [];
    const types: ('slime' | 'zombie' | 'skeleton')[] = ['slime', 'slime', 'zombie', 'slime', 'skeleton'];
    for (let i = 0; i < 5; i++) {
      const ex = (spawnX + 20 + i * 15) * TILE_SIZE;
      enemies.push(spawnEnemy(types[i], ex, (spawnY - 5) * TILE_SIZE));
    }

    stateRef.current = {
      world, player, enemies,
      particles: [],
      keys,
      joystick: createJoystick(),
      joystickTouchId: null,
      actionTouchIds: new Map(),
      inventory: { pickaxe: 1, sword: 1, torch: 3 },
      selectedSlot: 'pickaxe',
      jumpPressed: false,
      attackPressed: false,
      placePressed: false,
      heavyPressed: false,
      frameId: 0,
      time: 0,
      notification: null,
      enemySpawnTimer: 0,
    };

    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || !stateRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const s = stateRef.current;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Keyboard
    const onKeyDown = (e: KeyboardEvent) => {
      s.keys.add(e.key);
      if (e.key >= '1' && e.key <= '5') {
        const slots = ['pickaxe', 'sword', 'torch', 'dirt', 'stone'];
        s.selectedSlot = slots[parseInt(e.key) - 1];
      }
      if (e.key === 'e' || e.key === 'E') {
        if (s.player.stamina < s.player.maxStamina) {
          restoreStamina(s.player);
          setShowSleep(false);
          setShowSleepScreen(true);
        }
      }
      if (e.key === ' ') e.preventDefault();
    };
    const onKeyUp = (e: KeyboardEvent) => s.keys.delete(e.key);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Touch controls
    const JOYSTICK_ZONE = canvas.width * 0.4;
    const SLOT_KEYS = ['pickaxe', 'sword', 'torch', 'dirt', 'stone'];

    const getJoystickDelta = (cx: number, cy: number) => {
      const dx = cx - s.joystick.baseX;
      const dy = cy - s.joystick.baseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxR = 44;
      if (dist < 4) return { x: 0, y: 0 };
      return {
        x: Math.max(-1, Math.min(1, dx / maxR)),
        y: Math.max(-1, Math.min(1, dy / maxR)),
      };
    };

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      for (const t of Array.from(e.changedTouches)) {
        const tx = t.clientX, ty = t.clientY;
        const sw = canvas.width, sh = canvas.height;

        // Hotbar tap
        const slotSize = 48, slotGap = 4;
        const hotbarW = SLOT_KEYS.length * slotSize + (SLOT_KEYS.length - 1) * slotGap;
        const hbX = (sw - hotbarW) / 2, hbY = sh - slotSize - 8;
        if (ty > hbY && ty < sh) {
          for (let i = 0; i < SLOT_KEYS.length; i++) {
            const sx2 = hbX + i * (slotSize + slotGap);
            if (tx >= sx2 && tx <= sx2 + slotSize) {
              s.selectedSlot = SLOT_KEYS[i];
              continue;
            }
          }
        }

        // Joystick (left 40%)
        if (tx < JOYSTICK_ZONE && ty > sh * 0.5) {
          s.joystick.active = true;
          s.joystick.baseX = tx;
          s.joystick.baseY = ty;
          s.joystick.x = 0;
          s.joystick.y = 0;
          s.joystickTouchId = t.identifier;
          continue;
        }

        // Action buttons (right side)
        const jx = sw - 55, jy = sh - 155;
        const hx = sw - 110, hy = sh - 100;
        const ax = sw - 90, ay = sh - 90;
        const px2 = sw - 50, py = sh - 55;

        const dist = (x1: number, y1: number, x2: number, y2: number) =>
          Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);

        if (dist(tx, ty, jx, jy) < 32) {
          s.jumpPressed = true; s.keys.add(' ');
          s.actionTouchIds.set('jump', t.identifier);
        } else if (dist(tx, ty, hx, hy) < 32) {
          s.heavyPressed = true;
          s.actionTouchIds.set('heavy', t.identifier);
          doHeavyAttack();
        } else if (dist(tx, ty, ax, ay) < 32) {
          s.attackPressed = true;
          s.actionTouchIds.set('attack', t.identifier);
          doAttack();
        } else if (dist(tx, ty, px2, py) < 28) {
          s.placePressed = true;
          s.actionTouchIds.set('place', t.identifier);
          doPlace();
        } else if (tx > JOYSTICK_ZONE && ty < sh * 0.7) {
          // Mine/interact world tap
          const camX = s.player.x - canvas.width / 2 + s.player.w / 2;
          const camY = s.player.y - canvas.height / 2 + s.player.h / 2;
          const worldX = Math.floor((tx + camX) / TILE_SIZE);
          const worldY = Math.floor((ty + camY) / TILE_SIZE);
          doMine(worldX, worldY);
        }
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === s.joystickTouchId) {
          const d = getJoystickDelta(t.clientX, t.clientY);
          s.joystick.x = d.x;
          s.joystick.y = d.y;
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === s.joystickTouchId) {
          s.joystick.active = false;
          s.joystick.x = 0;
          s.joystick.y = 0;
          s.joystickTouchId = null;
        }
        for (const [action, id] of s.actionTouchIds.entries()) {
          if (id === t.identifier) {
            s.actionTouchIds.delete(action);
            if (action === 'jump')  { s.jumpPressed = false; s.keys.delete(' '); }
            if (action === 'attack') s.attackPressed = false;
            if (action === 'heavy')  s.heavyPressed = false;
            if (action === 'place')  s.placePressed  = false;
          }
        }
      }
    };

    canvas.addEventListener('touchstart',  onTouchStart, { passive: false });
    canvas.addEventListener('touchmove',   onTouchMove,  { passive: false });
    canvas.addEventListener('touchend',    onTouchEnd,   { passive: false });
    canvas.addEventListener('touchcancel', onTouchEnd,   { passive: false });

    // Mouse click for desktop (mine/place)
    const onMouseDown = (e: MouseEvent) => {
      const camX = s.player.x - canvas.width  / 2 + s.player.w / 2;
      const camY = s.player.y - canvas.height / 2 + s.player.h / 2;
      const tx = Math.floor((e.clientX + camX) / TILE_SIZE);
      const ty = Math.floor((e.clientY + camY) / TILE_SIZE);
      if (e.button === 0) doMine(tx, ty);
      if (e.button === 2) doPlace();
    };
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    const doAttack = () => {
      const { player, enemies, particles } = s;
      if (player.attackCooldown > 0) return;
      player.attackAnim = 180;
      player.attackCooldown = 25;
      const reach = 65;
      let hit = false;
      for (const e of enemies) {
        if (!e.alive) continue;
        const dx = (e.x + e.w / 2) - (player.x + player.w / 2);
        const dy = (e.y + e.h / 2) - (player.y + player.h / 2);
        if (Math.sqrt(dx * dx + dy * dy) < reach + e.w) {
          const dmg = 15 + player.level * 3;
          hitEnemy(e, dmg);
          spawnParticles(particles, e.x + e.w / 2, e.y + e.h / 2, '#f44336', 8, 4);
          hit = true;
          if (!e.alive) {
            const lvledUp = doGainExp(player, e.expReward);
            spawnParticles(particles, e.x + e.w / 2, e.y + e.h / 2, '#ffd600', 12, 5, 6);
            if (lvledUp) showNotif(`🎉 Уровень ${player.level}!`);
            else showNotif(`+${e.expReward} EXP`);
          }
        }
      }
      if (!hit) {
        spawnParticles(particles,
          player.x + (player.facingRight ? player.w + 15 : -15),
          player.y + player.h / 2,
          '#ffffff', 5, 2, 3,
        );
      }
      s.enemies = s.enemies.filter(e => e.alive || e.hitTimer > 0);
    };

    const doHeavyAttack = () => {
      const { player, enemies, particles } = s;
      if (player.attackCooldown > 0) return;
      if (player.stamina < 20) {
        setShowSleep(true);
        showNotif('⚡ Нет энергии! Поспи чтобы восстановить!');
        return;
      }
      player.stamina = Math.max(0, player.stamina - 20);
      player.heavyAttackAnim = 250;
      player.attackCooldown = 50;
      setShowSleep(player.stamina < 20);
      const reach = 90;
      let hitCount = 0;
      for (const e of enemies) {
        if (!e.alive) continue;
        const dx = (e.x + e.w / 2) - (player.x + player.w / 2);
        const dy = (e.y + e.h / 2) - (player.y + player.h / 2);
        if (Math.sqrt(dx * dx + dy * dy) < reach + e.w) {
          const dmg = Math.floor((30 + player.level * 6) * 1.8);
          hitEnemy(e, dmg);
          spawnParticles(particles, e.x + e.w / 2, e.y + e.h / 2, '#ff6f00', 14, 5);
          spawnParticles(particles, e.x + e.w / 2, e.y + e.h / 2, '#ffd600', 8, 3, 6);
          hitCount++;
          if (!e.alive) {
            const lvledUp = doGainExp(player, e.expReward);
            spawnParticles(particles, e.x + e.w / 2, e.y + e.h / 2, '#ffd600', 16, 6, 7);
            if (lvledUp) showNotif(`🎉 Уровень ${player.level}!`);
            else showNotif(`+${e.expReward} EXP`);
          }
        }
      }
      if (hitCount === 0) {
        spawnParticles(particles,
          player.x + (player.facingRight ? player.w + 20 : -20),
          player.y + player.h / 3,
          '#ff8f00', 8, 3, 4,
        );
      }
      s.enemies = s.enemies.filter(e => e.alive || e.hitTimer > 0);
    };

    const doMine = (tx: number, ty: number) => {
      const { world, player, particles, inventory } = s;
      if (tx < 0 || tx >= WORLD_W || ty < 0 || ty >= 128) return;
      const playerTX = Math.floor((player.x + player.w / 2) / TILE_SIZE);
      const playerTY = Math.floor((player.y + player.h / 2) / TILE_SIZE);
      const reach = 5;
      if (Math.abs(tx - playerTX) > reach || Math.abs(ty - playerTY) > reach) return;
      const tile = world[ty * WORLD_W + tx] as Tile;
      const def = TILE_DEFS[tile];
      if (!def?.breakable) return;
      world[ty * WORLD_W + tx] = Tile.AIR;
      const color = TILE_COLORS[tile] ?? '#9e9e9e';
      spawnParticles(particles, tx * TILE_SIZE + 16, ty * TILE_SIZE + 16, color, 8, 3, 5);
      if (def.drops) {
        inventory[def.drops] = (inventory[def.drops] ?? 0) + 1;
        showNotif(`+1 ${def.drops}`);
      }
    };

    const doPlace = () => {
      const { world, player, inventory, selectedSlot } = s;
      const PLACE_MAP: Record<string, Tile> = {
        dirt: Tile.DIRT, stone: Tile.STONE, wood: Tile.WOOD, torch: Tile.TORCH,
      };
      const tile = PLACE_MAP[selectedSlot];
      if (!tile) return;
      if (!inventory[selectedSlot] || inventory[selectedSlot] <= 0) { showNotif('Нет блоков!'); return; }
      const px = player.facingRight ? player.x + player.w + 4 : player.x - TILE_SIZE - 4;
      const py = player.y + player.h / 2;
      const tx = Math.floor(px / TILE_SIZE);
      const ty = Math.floor(py / TILE_SIZE);
      if (world[ty * WORLD_W + tx] === Tile.AIR) {
        world[ty * WORLD_W + tx] = tile;
        inventory[selectedSlot]--;
        if (inventory[selectedSlot] <= 0) delete inventory[selectedSlot];
        spawnParticles(s.particles, tx * TILE_SIZE + 16, ty * TILE_SIZE + 16, '#aaa', 4, 2, 3);
      }
    };

    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(now - lastTime, 32);
      lastTime = now;
      s.time += dt;

      const sw = canvas.width;
      const sh = canvas.height;

      // Update
      updatePlayer(s.player, s.world, s.keys, s.joystick.x, s.joystick.y, dt);

      updateEnemies(s.enemies, s.world, s.player, (dmg) => {
        s.player.hp = Math.max(0, s.player.hp - dmg);
        spawnParticles(s.particles, s.player.x + s.player.w / 2, s.player.y, '#f44336', 4, 2);
        if (s.player.hp <= 0) { s.player.hp = 30; showNotif('💀 Ты погиб! Возрождение...'); }
      });

      s.particles = updateParticles(s.particles);

      // Enemy spawn
      s.enemySpawnTimer++;
      if (s.enemySpawnTimer > 500 && s.enemies.filter(e => e.alive).length < 15) {
        s.enemySpawnTimer = 0;
        const side = Math.random() > 0.5 ? 1 : -1;
        const ex = s.player.x + side * (sw * 0.6 + Math.random() * 200);
        const allTypes: Array<'slime' | 'zombie' | 'skeleton' | 'goblin' | 'troll' | 'bat'> =
          ['slime', 'zombie', 'skeleton', 'goblin', 'troll', 'bat'];
        const weights = [25, 20, 18, 18, 8, 11]; // вероятности
        const rnd = Math.random() * 100; let cumul = 0, et = allTypes[0];
        for (let i = 0; i < allTypes.length; i++) { cumul += weights[i]; if (rnd < cumul) { et = allTypes[i]; break; } }
        s.enemies.push(spawnEnemy(et, Math.max(0, Math.min((WORLD_W - 2) * TILE_SIZE, ex)), s.player.y - 100));
        s.enemies = s.enemies.filter(e => e.alive);
      }

      // Camera
      const camX = Math.max(0, Math.min(WORLD_W * TILE_SIZE - sw, s.player.x - sw / 2 + s.player.w / 2));
      const camY = Math.max(0, Math.min(128 * TILE_SIZE - sh, s.player.y - sh / 2 + s.player.h / 2));

      // Render
      const lowStamina = s.player.stamina < 20;
      renderWorld(
        ctx, s.world, camX, camY, sw, sh,
        s.player, s.enemies, s.particles,
        s.time, s.inventory, s.selectedSlot,
        s.player.hp, s.player.maxHp,
        s.player.mana, s.player.maxMana,
        s.player.level, s.player.exp, s.player.expNext,
        s.player.stamina, s.player.maxStamina,
        lowStamina,
      );

      // Draw controls overlay
      drawJoystick(ctx, s.joystick, sw, sh);
      drawActionButtons(ctx, sw, sh, s.jumpPressed, s.attackPressed, s.placePressed, s.heavyPressed, s.player.stamina);

      s.frameId = requestAnimationFrame(loop);
    };

    s.frameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(s.frameId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('touchstart',  onTouchStart);
      canvas.removeEventListener('touchmove',   onTouchMove);
      canvas.removeEventListener('touchend',    onTouchEnd);
      canvas.removeEventListener('touchcancel', onTouchEnd);
      canvas.removeEventListener('mousedown', onMouseDown);
    };
  }, [ready, showNotif]);

  const handleSleep = useCallback(() => {
    if (!stateRef.current) return;
    restoreStamina(stateRef.current.player);
    setShowSleep(false);
    setShowSleepScreen(true);
    setNotification('💤 Ты выспался! Энергия восстановлена!');
    setTimeout(() => setNotification(null), 2200);
  }, []);

  const handleWakeUp = useCallback(() => {
    setShowSleepScreen(false);
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0a0a2e', overflow: 'hidden' }}>
      {!ready && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', color: '#4caf50',
          fontFamily: "'Press Start 2P', monospace", gap: 16,
        }}>
          <div style={{ fontSize: 14 }}>⛏ Генерация мира...</div>
          <div style={{ fontSize: 8, color: '#555', animation: 'pulse 1s infinite' }}>Pixel Farm RPG</div>
        </div>
      )}
      <canvas
        ref={canvasRef}
        style={{ display: 'block', touchAction: 'none', imageRendering: 'pixelated' }}
      />

      {/* Кнопка Спать (мобильная) */}
      {showSleep && (
        <button
          onClick={handleSleep}
          style={{
            position: 'fixed', right: 16, top: '50%', transform: 'translateY(-50%)',
            background: '#1565c0', border: '2px solid #ffd600',
            color: '#fff', fontFamily: 'monospace', fontSize: 12,
            padding: '10px 16px', cursor: 'pointer', zIndex: 200,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          }}
        >
          <span style={{ fontSize: 20 }}>💤</span>
          <span>СПАТЬ</span>
        </button>
      )}

      {/* Экран сна */}
      {showSleepScreen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,20,0.97)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', zIndex: 300, gap: 20,
          fontFamily: "'Press Start 2P', monospace",
        }}>
          <div style={{ fontSize: 48 }}>🛏️</div>
          <div style={{ color: '#ffd600', fontSize: 14 }}>КОМНАТА СНА</div>
          <div style={{ color: '#aaa', fontSize: 8, textAlign: 'center', maxWidth: 300 }}>
            Ты отдыхаешь...<br/>Энергия восстановлена полностью!
          </div>
          {stateRef.current && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 260, marginTop: 10 }}>
              <div style={{ color: '#69f0ae', fontSize: 8, borderBottom: '1px solid #333', paddingBottom: 6 }}>
                ПРОКАЧКА ПЕРСОНАЖА
              </div>
              {[
                { label: '❤️ +20 HP', cost: 50, action: () => {
                  const p = stateRef.current!.player;
                  if (stateRef.current!.inventory['gold'] >= 1) {
                    stateRef.current!.inventory['gold'] = (stateRef.current!.inventory['gold'] ?? 0) - 1;
                    p.maxHp += 20; p.hp = Math.min(p.hp + 20, p.maxHp);
                    showNotif('❤️ +20 максимум HP!');
                  } else { showNotif('Нужно золото!'); }
                }},
                { label: '⚡ +20 Энергия', cost: 50, action: () => {
                  const p = stateRef.current!.player;
                  if (stateRef.current!.inventory['gold'] >= 1) {
                    stateRef.current!.inventory['gold'] = (stateRef.current!.inventory['gold'] ?? 0) - 1;
                    p.maxStamina += 20; p.stamina = p.maxStamina;
                    setShowSleep(false);
                    showNotif('⚡ +20 максимум энергии!');
                  } else { showNotif('Нужно золото!'); }
                }},
                { label: '✦ +15 Мана', cost: 50, action: () => {
                  const p = stateRef.current!.player;
                  if (stateRef.current!.inventory['gold'] >= 1) {
                    stateRef.current!.inventory['gold'] = (stateRef.current!.inventory['gold'] ?? 0) - 1;
                    p.maxMana += 15; p.mana = Math.min(p.mana + 15, p.maxMana);
                    showNotif('✦ +15 максимум маны!');
                  } else { showNotif('Нужно золото!'); }
                }},
              ].map((u, i) => (
                <button key={i} onClick={u.action} style={{
                  background: '#0d47a1', border: '1px solid #42a5f5',
                  color: '#fff', fontSize: 9, padding: '8px 12px',
                  cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                  fontFamily: 'monospace',
                }}>
                  <span>{u.label}</span>
                  <span style={{ color: '#ffd600' }}>1 золото</span>
                </button>
              ))}
            </div>
          )}
          <button
            onClick={handleWakeUp}
            style={{
              marginTop: 16, background: '#2e7d32', border: '2px solid #69f0ae',
              color: '#fff', fontSize: 10, padding: '12px 32px',
              cursor: 'pointer', fontFamily: 'monospace',
            }}
          >
            ☀️ ПРОСНУТЬСЯ
          </button>
        </div>
      )}

      {notification && (
        <div style={{
          position: 'fixed', top: 60, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.85)', border: '2px solid #4caf50',
          color: '#4caf50', fontFamily: "'Press Start 2P', monospace",
          fontSize: 9, padding: '10px 18px', borderRadius: 0,
          whiteSpace: 'nowrap', zIndex: 100,
          animation: 'notif-in 0.2s ease',
          pointerEvents: 'none',
        }}>
          {notification}
        </div>
      )}
      <style>{`
        @keyframes notif-in {
          from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 1; }
        }
      `}</style>
    </div>
  );
}