import { Tile, TILE_SIZE, isSolid } from './tiles';
import { WORLD_W, WORLD_H } from './worldgen';
import { Player } from './player';

export type EnemyType = 'slime' | 'zombie' | 'skeleton';

export interface Enemy {
  id: number;
  type: EnemyType;
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  alive: boolean;
  onGround: boolean;
  facingRight: boolean;
  attackCooldown: number;
  hitFlash: boolean;
  hitTimer: number;
  aggroRange: number;
  attackRange: number;
  damage: number;
  speed: number;
  expReward: number;
}

let nextId = 1;

const ENEMY_DEFS: Record<EnemyType, Partial<Enemy>> = {
  slime:    { w: 28, h: 20, hp: 25,  maxHp: 25,  damage: 5,  speed: 1.0, aggroRange: 160, attackRange: 30, expReward: 15 },
  zombie:   { w: 20, h: 36, hp: 55,  maxHp: 55,  damage: 12, speed: 1.3, aggroRange: 200, attackRange: 28, expReward: 30 },
  skeleton: { w: 20, h: 34, hp: 40,  maxHp: 40,  damage: 18, speed: 1.8, aggroRange: 240, attackRange: 34, expReward: 45 },
};

const GRAVITY = 0.45;
const FRICTION = 0.85;

export function spawnEnemy(type: EnemyType, x: number, y: number): Enemy {
  const def = ENEMY_DEFS[type];
  return {
    id: nextId++,
    type, x, y,
    vx: 0, vy: 0,
    alive: true,
    onGround: false,
    facingRight: Math.random() > 0.5,
    attackCooldown: 0,
    hitFlash: false,
    hitTimer: 0,
    w: def.w!, h: def.h!,
    hp: def.hp!, maxHp: def.maxHp!,
    damage: def.damage!, speed: def.speed!,
    aggroRange: def.aggroRange!, attackRange: def.attackRange!,
    expReward: def.expReward!,
  };
}

function getTile(world: Uint8Array, tx: number, ty: number): Tile {
  if (tx < 0 || tx >= WORLD_W || ty < 0 || ty >= WORLD_H) return Tile.STONE;
  return world[ty * WORLD_W + tx] as Tile;
}

function resolveY(e: Enemy, world: Uint8Array) {
  const left  = Math.floor((e.x + 2) / TILE_SIZE);
  const right = Math.floor((e.x + e.w - 3) / TILE_SIZE);
  const top   = Math.floor(e.y / TILE_SIZE);
  const bot   = Math.floor((e.y + e.h - 1) / TILE_SIZE);
  e.onGround = false;
  for (let tx = left; tx <= right; tx++) {
    if (e.vy < 0 && isSolid(getTile(world, tx, top))) { e.y = (top + 1) * TILE_SIZE; e.vy = 0; }
    if (e.vy > 0 && isSolid(getTile(world, tx, bot)))  { e.y = bot * TILE_SIZE - e.h; e.vy = 0; e.onGround = true; }
  }
}

function resolveX(e: Enemy, world: Uint8Array) {
  const left  = Math.floor(e.x / TILE_SIZE);
  const right = Math.floor((e.x + e.w - 1) / TILE_SIZE);
  const top   = Math.floor(e.y / TILE_SIZE);
  const bot   = Math.floor((e.y + e.h - 2) / TILE_SIZE);
  for (let ty = top; ty <= bot; ty++) {
    if (e.vx < 0 && isSolid(getTile(world, left, ty)))  { e.x = (left + 1) * TILE_SIZE; e.vx = 0; }
    if (e.vx > 0 && isSolid(getTile(world, right, ty))) { e.x = right * TILE_SIZE - e.w; e.vx = 0; }
  }
}

export function updateEnemies(
  enemies: Enemy[],
  world: Uint8Array,
  player: Player,
  onHitPlayer: (dmg: number) => void,
): void {
  for (const e of enemies) {
    if (!e.alive) continue;

    const dx = player.x + player.w / 2 - (e.x + e.w / 2);
    const dy = player.y + player.h / 2 - (e.y + e.h / 2);
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Aggro
    if (dist < e.aggroRange) {
      const dir = dx > 0 ? 1 : -1;
      e.vx += dir * e.speed * 0.3;
      e.facingRight = dx > 0;

      // Jump over walls
      if (e.onGround && Math.abs(e.vx) < 0.5) {
        const tileAhead = getTile(world, Math.floor((e.x + e.w / 2 + dir * 20) / TILE_SIZE), Math.floor((e.y + e.h / 2) / TILE_SIZE));
        if (isSolid(tileAhead)) e.vy = -7;
      }

      // Attack
      if (dist < e.attackRange && e.attackCooldown <= 0) {
        onHitPlayer(e.damage);
        e.attackCooldown = 80;
      }
    }

    // Physics
    e.vx *= FRICTION;
    e.vy += GRAVITY;
    e.vy = Math.min(12, e.vy);

    e.x += e.vx;
    resolveX(e, world);
    e.y += e.vy;
    resolveY(e, world);

    e.x = Math.max(0, Math.min(WORLD_W * TILE_SIZE - e.w, e.x));
    e.y = Math.max(0, Math.min(WORLD_H * TILE_SIZE - e.h, e.y));

    if (e.attackCooldown > 0) e.attackCooldown--;
    if (e.hitTimer > 0) {
      e.hitTimer--;
      e.hitFlash = e.hitTimer % 4 < 2;
    }
  }
}

export function hitEnemy(e: Enemy, damage: number) {
  e.hp -= damage;
  e.hitTimer = 12;
  if (e.hp <= 0) { e.hp = 0; e.alive = false; }
}
