import { Tile, TILE_SIZE, isSolid } from './tiles';
import { WORLD_W, WORLD_H } from './worldgen';

export interface Player {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  onGround: boolean;
  facingRight: boolean;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  level: number;
  exp: number;
  expNext: number;
  attackCooldown: number;
  manaRegen: number;
}

const GRAVITY = 0.45;
const JUMP_FORCE = -9.5;
const MOVE_SPEED = 3.5;
const MAX_FALL = 14;
const FRICTION = 0.82;

export function createPlayer(spawnX: number, spawnY: number): Player {
  return {
    x: spawnX, y: spawnY,
    w: 20, h: 34,
    vx: 0, vy: 0,
    onGround: false,
    facingRight: true,
    hp: 100, maxHp: 100,
    mana: 60, maxMana: 60,
    level: 1, exp: 0, expNext: 100,
    attackCooldown: 0,
    manaRegen: 0,
  };
}

export function updatePlayer(
  p: Player,
  world: Uint8Array,
  keys: Set<string>,
  joystickX: number,
  joystickY: number,
  dt: number,
) {
  const left  = keys.has('ArrowLeft')  || keys.has('a') || joystickX < -0.3;
  const right = keys.has('ArrowRight') || keys.has('d') || joystickX > 0.3;
  const jump  = keys.has('ArrowUp')    || keys.has('w') || keys.has(' ') || joystickY < -0.6;

  if (left)  { p.vx -= 1.2; p.facingRight = false; }
  if (right) { p.vx += 1.2; p.facingRight = true; }

  p.vx *= FRICTION;
  p.vx = Math.max(-MOVE_SPEED, Math.min(MOVE_SPEED, p.vx));

  p.vy += GRAVITY;
  p.vy = Math.min(MAX_FALL, p.vy);

  if (jump && p.onGround) {
    p.vy = JUMP_FORCE;
    p.onGround = false;
  }

  // Move X
  p.x += p.vx;
  resolveAxisX(p, world);

  // Move Y
  p.y += p.vy;
  p.onGround = false;
  resolveAxisY(p, world);

  // Clamp world
  p.x = Math.max(0, Math.min(WORLD_W * TILE_SIZE - p.w, p.x));
  p.y = Math.max(0, Math.min(WORLD_H * TILE_SIZE - p.h, p.y));

  // Cooldowns
  if (p.attackCooldown > 0) p.attackCooldown -= dt;

  // Mana regen
  p.manaRegen += dt;
  if (p.manaRegen >= 60) {
    p.mana = Math.min(p.maxMana, p.mana + 1);
    p.manaRegen = 0;
  }
}

function getTile(world: Uint8Array, tx: number, ty: number): Tile {
  if (tx < 0 || tx >= WORLD_W || ty < 0 || ty >= WORLD_H) return Tile.STONE;
  return world[ty * WORLD_W + tx] as Tile;
}

function resolveAxisX(p: Player, world: Uint8Array) {
  const left  = Math.floor(p.x / TILE_SIZE);
  const right = Math.floor((p.x + p.w - 1) / TILE_SIZE);
  const top   = Math.floor(p.y / TILE_SIZE);
  const bot   = Math.floor((p.y + p.h - 2) / TILE_SIZE);
  for (let ty = top; ty <= bot; ty++) {
    if (p.vx < 0 && isSolid(getTile(world, left, ty))) {
      p.x = (left + 1) * TILE_SIZE;
      p.vx = 0;
    }
    if (p.vx > 0 && isSolid(getTile(world, right, ty))) {
      p.x = right * TILE_SIZE - p.w;
      p.vx = 0;
    }
  }
}

function resolveAxisY(p: Player, world: Uint8Array) {
  const left  = Math.floor((p.x + 2) / TILE_SIZE);
  const right = Math.floor((p.x + p.w - 3) / TILE_SIZE);
  const top   = Math.floor(p.y / TILE_SIZE);
  const bot   = Math.floor((p.y + p.h - 1) / TILE_SIZE);
  for (let tx = left; tx <= right; tx++) {
    if (p.vy < 0 && isSolid(getTile(world, tx, top))) {
      p.y = (top + 1) * TILE_SIZE;
      p.vy = 0;
    }
    if (p.vy > 0 && isSolid(getTile(world, tx, bot))) {
      p.y = bot * TILE_SIZE - p.h;
      p.vy = 0;
      p.onGround = true;
    }
  }
}

export function gainExp(p: Player, amount: number): boolean {
  p.exp += amount;
  if (p.exp >= p.expNext) {
    p.exp -= p.expNext;
    p.level++;
    p.expNext = Math.floor(p.expNext * 1.5);
    p.maxHp += 15;
    p.hp = Math.min(p.hp + 20, p.maxHp);
    p.maxMana += 8;
    p.mana = Math.min(p.mana + 10, p.maxMana);
    return true; // leveled up
  }
  return false;
}
