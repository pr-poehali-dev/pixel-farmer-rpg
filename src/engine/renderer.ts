import { Tile, TILE_DEFS, TILE_SIZE } from './tiles';
import { WORLD_W, WORLD_H } from './worldgen';
import { Player } from './player';
import { Enemy } from './enemies';
import { Particle } from './particles';

const COLORS = {
  sky_top: '#0a0a2e',
  sky_mid: '#1a237e',
  sky_horizon: '#283593',
  sun: '#ffd600',
  cloud: 'rgba(255,255,255,0.7)',
};

export function renderWorld(
  ctx: CanvasRenderingContext2D,
  world: Uint8Array,
  camX: number,
  camY: number,
  screenW: number,
  screenH: number,
  player: Player,
  enemies: Enemy[],
  particles: Particle[],
  time: number,
  inventory: Record<string, number>,
  selectedSlot: string,
  hp: number,
  maxHp: number,
  mana: number,
  maxMana: number,
  level: number,
  exp: number,
  expNext: number,
) {
  ctx.clearRect(0, 0, screenW, screenH);

  // Sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, screenH * 0.7);
  skyGrad.addColorStop(0, COLORS.sky_top);
  skyGrad.addColorStop(0.5, COLORS.sky_mid);
  skyGrad.addColorStop(1, COLORS.sky_horizon);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, screenW, screenH);

  // Sun
  const sunX = screenW * 0.75;
  const sunY = 60 + Math.sin(time * 0.0002) * 20;
  ctx.fillStyle = COLORS.sun;
  ctx.shadowBlur = 30;
  ctx.shadowColor = '#ffd600';
  ctx.beginPath();
  ctx.arc(sunX, sunY, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Clouds
  for (let c = 0; c < 5; c++) {
    const cx = ((time * 0.015 + c * 200) % (screenW + 200)) - 100;
    const cy = 40 + c * 25;
    ctx.fillStyle = COLORS.cloud;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 50, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 30, cy - 8, 35, 14, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Tiles
  const startX = Math.max(0, Math.floor(camX / TILE_SIZE) - 1);
  const endX   = Math.min(WORLD_W, Math.ceil((camX + screenW) / TILE_SIZE) + 1);
  const startY = Math.max(0, Math.floor(camY / TILE_SIZE) - 1);
  const endY   = Math.min(WORLD_H, Math.ceil((camY + screenH) / TILE_SIZE) + 1);

  for (let ty = startY; ty < endY; ty++) {
    for (let tx = startX; tx < endX; tx++) {
      const tile = world[ty * WORLD_W + tx] as Tile;
      if (tile === Tile.AIR) continue;
      const def = TILE_DEFS[tile];
      const sx = tx * TILE_SIZE - camX;
      const sy = ty * TILE_SIZE - camY;

      if (tile === Tile.WATER) {
        const wave = Math.sin(time * 0.002 + tx * 0.5) * 2;
        ctx.fillStyle = '#1565c0';
        ctx.globalAlpha = 0.7;
        ctx.fillRect(sx, sy + wave, TILE_SIZE, TILE_SIZE);
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#42a5f5';
        ctx.fillRect(sx, sy + wave, TILE_SIZE, 6);
        ctx.globalAlpha = 1;
        continue;
      }

      if (tile === Tile.LEAVES) {
        const sway = Math.sin(time * 0.001 + tx * 0.3) * 1.5;
        ctx.fillStyle = tx % 2 === 0 ? '#388e3c' : '#2e7d32';
        ctx.fillRect(sx + sway, sy, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#43a047';
        ctx.fillRect(sx + sway + 4, sy + 4, TILE_SIZE - 8, TILE_SIZE - 8);
        continue;
      }

      // Main tile
      ctx.fillStyle = def.color;
      ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);

      // Grass top stripe
      if (tile === Tile.GRASS && def.top) {
        ctx.fillStyle = def.top;
        ctx.fillRect(sx, sy, TILE_SIZE, 6);
        // Grass blades
        ctx.fillStyle = '#66bb6a';
        for (let g = 0; g < 4; g++) {
          const gx = sx + 2 + g * 8;
          const sway2 = Math.sin(time * 0.001 + tx * 0.5 + g) * 2;
          ctx.fillRect(gx + sway2, sy - 4, 2, 5);
        }
      }

      // Stone texture
      if (tile === Tile.STONE || tile === Tile.DEEP_STONE) {
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(sx, sy, 2, TILE_SIZE);
        ctx.fillRect(sx, sy, TILE_SIZE, 2);
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(sx + TILE_SIZE - 2, sy, 2, TILE_SIZE);
        ctx.fillRect(sx, sy + TILE_SIZE - 2, TILE_SIZE, 2);
      }

      // Dirt texture
      if (tile === Tile.DIRT) {
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        if ((tx + ty) % 3 === 0) ctx.fillRect(sx + 6, sy + 6, 4, 4);
        if ((tx + ty) % 5 === 0) ctx.fillRect(sx + 18, sy + 16, 3, 3);
      }

      // Wood texture
      if (tile === Tile.WOOD) {
        ctx.fillStyle = '#4e342e';
        ctx.fillRect(sx + 12, sy, 8, TILE_SIZE);
        ctx.fillStyle = '#8d6e63';
        ctx.fillRect(sx + 14, sy, 2, TILE_SIZE);
      }

      // Ore sparkle
      if (tile === Tile.ORE_COAL || tile === Tile.ORE_IRON || tile === Tile.ORE_GOLD) {
        const oreColor = tile === Tile.ORE_COAL ? '#212121' : tile === Tile.ORE_IRON ? '#bf8860' : '#ffd600';
        ctx.fillStyle = oreColor;
        ctx.fillRect(sx + 8,  sy + 8,  6, 6);
        ctx.fillRect(sx + 18, sy + 16, 6, 6);
        ctx.fillRect(sx + 10, sy + 20, 4, 4);
        if (tile === Tile.ORE_GOLD) {
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#ffd600';
          ctx.fillRect(sx + 8, sy + 8, 6, 6);
          ctx.shadowBlur = 0;
        }
      }

      // Chest
      if (tile === Tile.CHEST) {
        ctx.fillStyle = '#6d4c41';
        ctx.fillRect(sx + 2, sy + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        ctx.fillStyle = '#ffd600';
        ctx.fillRect(sx + 10, sy + 12, 12, 8);
        ctx.fillRect(sx + 14, sy + 10, 4, 12);
        ctx.fillStyle = '#a1887f';
        ctx.fillRect(sx + 2, sy + 14, TILE_SIZE - 4, 4);
      }

      // Torch glow
      if (tile === Tile.TORCH) {
        const glow = ctx.createRadialGradient(sx + 16, sy + 16, 0, sx + 16, sy + 16, 48);
        glow.addColorStop(0, 'rgba(255,150,0,0.3)');
        glow.addColorStop(1, 'rgba(255,150,0,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(sx - 32, sy - 32, 96, 96);
        ctx.fillStyle = '#ff8f00';
        ctx.fillRect(sx + 14, sy + 4, 4, 20);
        ctx.fillStyle = '#ffd600';
        ctx.beginPath();
        ctx.ellipse(sx + 16, sy + 6 + Math.sin(time * 0.005) * 2, 4, 6, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Tile border
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(sx, sy, TILE_SIZE, TILE_SIZE);
    }
  }

  // Particles
  for (const p of particles) {
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.fillStyle = p.color;
    const px = p.x - camX;
    const py = p.y - camY;
    ctx.fillRect(px - p.size / 2, py - p.size / 2, p.size, p.size);
    ctx.globalAlpha = 1;
  }

  // Enemies
  for (const e of enemies) {
    if (!e.alive) continue;
    const ex = e.x - camX;
    const ey = e.y - camY;
    drawEnemy(ctx, e, ex, ey, time);
  }

  // Player
  drawPlayer(ctx, player, screenW / 2 - player.w / 2, screenH / 2 - player.h / 2, time);

  // HUD
  drawHUD(ctx, screenW, screenH, inventory, selectedSlot, hp, maxHp, mana, maxMana, level, exp, expNext);
}

function drawPlayer(ctx: CanvasRenderingContext2D, player: Player, x: number, y: number, time: number) {
  const { w, h, facingRight, onGround, vx } = player;
  const walking = onGround && Math.abs(vx) > 0.5;
  const legSwing = walking ? Math.sin(time * 0.01) * 8 : 0;

  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  if (!facingRight) ctx.scale(-1, 1);

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(0, h / 2 + 2, 12, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.fillStyle = '#5c8a3c';
  ctx.fillRect(-8, -10, 16, 14);

  // Belt
  ctx.fillStyle = '#8d6e63';
  ctx.fillRect(-9, 1, 18, 3);

  // Legs
  ctx.fillStyle = '#4527a0';
  ctx.fillRect(-8, 4 + legSwing, 7, 12);
  ctx.fillRect(1,  4 - legSwing, 7, 12);

  // Boots
  ctx.fillStyle = '#3e2723';
  ctx.fillRect(-8, 14 + legSwing, 7, 4);
  ctx.fillRect(1,  14 - legSwing, 7, 4);

  // Arms
  const armSwing = walking ? Math.sin(time * 0.01) * 10 : 0;
  ctx.fillStyle = '#ffcc80';
  ctx.fillRect(-14, -8 - armSwing, 6, 12);
  ctx.fillRect( 8,  -8 + armSwing, 6, 12);

  // Pickaxe in hand
  ctx.fillStyle = '#9e9e9e';
  ctx.fillRect(12, -12, 4, 16);
  ctx.fillStyle = '#795548';
  ctx.fillRect(10, -16, 12, 5);

  // Head
  ctx.fillStyle = '#ffcc80';
  ctx.fillRect(-9, -24, 18, 16);

  // Eyes
  ctx.fillStyle = '#1a237e';
  ctx.fillRect(-5, -20, 4, 5);
  ctx.fillRect(2,  -20, 4, 5);

  // Pupils
  ctx.fillStyle = '#000';
  ctx.fillRect(-4, -19, 2, 3);
  ctx.fillRect(3,  -19, 2, 3);

  // Hair
  ctx.fillStyle = '#6d4c41';
  ctx.fillRect(-9, -24, 18, 5);
  ctx.fillRect(-9, -24, 4, 8);

  // Hat
  ctx.fillStyle = '#4a148c';
  ctx.fillRect(-10, -28, 20, 5);
  ctx.fillRect(-6, -36, 12, 9);

  ctx.restore();
}

function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy, x: number, y: number, time: number) {
  ctx.save();
  ctx.translate(x + e.w / 2, y + e.h / 2);
  if (!e.facingRight) ctx.scale(-1, 1);

  const bob = Math.sin(time * 0.005 + e.x) * 3;

  // HP bar
  const barW = 36;
  const barH = 4;
  ctx.fillStyle = '#b71c1c';
  ctx.fillRect(-barW / 2, -e.h / 2 - 12 + bob, barW, barH);
  ctx.fillStyle = '#f44336';
  ctx.fillRect(-barW / 2, -e.h / 2 - 12 + bob, barW * (e.hp / e.maxHp), barH);

  if (e.type === 'slime') {
    // Body
    ctx.fillStyle = e.hitFlash ? '#ff5252' : '#4caf50';
    ctx.beginPath();
    ctx.ellipse(0, 4 + bob, 16, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    // Eyes
    ctx.fillStyle = '#fff';
    ctx.fillRect(-6, -2 + bob, 5, 5);
    ctx.fillRect(2,  -2 + bob, 5, 5);
    ctx.fillStyle = '#000';
    ctx.fillRect(-5, -1 + bob, 3, 3);
    ctx.fillRect(3,  -1 + bob, 3, 3);
  } else if (e.type === 'zombie') {
    // Body
    ctx.fillStyle = e.hitFlash ? '#ff5252' : '#558b2f';
    ctx.fillRect(-9, -4 + bob, 18, 16);
    // Head
    ctx.fillStyle = e.hitFlash ? '#ff8a65' : '#aed581';
    ctx.fillRect(-8, -20 + bob, 16, 16);
    // Eyes
    ctx.fillStyle = '#f44336';
    ctx.fillRect(-5, -16 + bob, 4, 4);
    ctx.fillRect(2,  -16 + bob, 4, 4);
    // Legs
    ctx.fillStyle = '#1b5e20';
    ctx.fillRect(-9, 12 + bob, 7, 12);
    ctx.fillRect(2,  12 + bob, 7, 12);
    // Arms outstretched
    ctx.fillStyle = '#aed581';
    ctx.fillRect(-18, -2 + bob, 10, 6);
    ctx.fillRect(8,   -2 + bob, 10, 6);
  } else if (e.type === 'skeleton') {
    ctx.fillStyle = e.hitFlash ? '#ff5252' : '#eeeeee';
    // Skull
    ctx.beginPath();
    ctx.arc(0, -14 + bob, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.fillRect(-5, -17 + bob, 3, 4);
    ctx.fillRect(2,  -17 + bob, 3, 4);
    // Ribs
    ctx.fillStyle = e.hitFlash ? '#ff5252' : '#f5f5f5';
    for (let r = 0; r < 3; r++) {
      ctx.fillRect(-10, -4 + r * 6 + bob, 20, 3);
    }
    // Legs
    ctx.fillRect(-8, 14 + bob, 5, 14);
    ctx.fillRect(3,  14 + bob, 5, 14);
    // Sword
    ctx.fillStyle = '#bdbdbd';
    ctx.fillRect(10, -12 + bob, 3, 22);
    ctx.fillRect(6, -12 + bob, 12, 4);
  }

  ctx.restore();
}

function drawHUD(
  ctx: CanvasRenderingContext2D,
  sw: number, sh: number,
  inventory: Record<string, number>,
  selectedSlot: string,
  hp: number, maxHp: number,
  mana: number, maxMana: number,
  level: number,
  exp: number, expNext: number,
) {
  // Top bars
  const barW = 120, barH = 10;
  const pad = 10;

  // HP
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(pad, pad, barW + 4, barH + 4);
  ctx.fillStyle = '#b71c1c';
  ctx.fillRect(pad + 2, pad + 2, barW, barH);
  ctx.fillStyle = '#f44336';
  ctx.fillRect(pad + 2, pad + 2, barW * (hp / maxHp), barH);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 9px monospace';
  ctx.fillText(`♥ ${hp}/${maxHp}`, pad + 6, pad + 11);

  // Mana
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(pad, pad + 16, barW + 4, barH + 4);
  ctx.fillStyle = '#0d47a1';
  ctx.fillRect(pad + 2, pad + 18, barW, barH);
  ctx.fillStyle = '#2196f3';
  ctx.fillRect(pad + 2, pad + 18, barW * (mana / maxMana), barH);
  ctx.fillStyle = '#fff';
  ctx.fillText(`✦ ${mana}/${maxMana}`, pad + 6, pad + 27);

  // Level & EXP
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(pad, pad + 32, barW + 4, barH + 4);
  ctx.fillStyle = '#e65100';
  ctx.fillRect(pad + 2, pad + 34, barW, barH);
  ctx.fillStyle = '#ff9800';
  ctx.fillRect(pad + 2, pad + 34, barW * (exp / expNext), barH);
  ctx.fillStyle = '#ffd600';
  ctx.fillText(`Lv.${level} EXP ${exp}/${expNext}`, pad + 4, pad + 43);

  // Hotbar
  const slots = [
    { key: 'pickaxe', label: '⛏', name: 'Кирка' },
    { key: 'sword',   label: '⚔', name: 'Меч' },
    { key: 'torch',   label: '🔥', name: 'Факел' },
    { key: 'dirt',    label: '🟫', name: 'Земля' },
    { key: 'stone',   label: '⬜', name: 'Камень' },
  ];
  const slotSize = 44;
  const hotbarW = slots.length * slotSize + (slots.length - 1) * 4;
  const hbX = (sw - hotbarW) / 2;
  const hbY = sh - slotSize - 8;

  for (let i = 0; i < slots.length; i++) {
    const s = slots[i];
    const sx = hbX + i * (slotSize + 4);
    const isSelected = s.key === selectedSlot;

    ctx.fillStyle = isSelected ? 'rgba(255,214,0,0.35)' : 'rgba(0,0,0,0.65)';
    ctx.strokeStyle = isSelected ? '#ffd600' : 'rgba(255,255,255,0.25)';
    ctx.lineWidth = isSelected ? 2.5 : 1.5;
    ctx.fillRect(sx, hbY, slotSize, slotSize);
    ctx.strokeRect(sx, hbY, slotSize, slotSize);

    ctx.font = '22px serif';
    ctx.textAlign = 'center';
    ctx.fillText(s.label, sx + slotSize / 2, hbY + 28);

    const qty = inventory[s.key] ?? 0;
    if (qty > 0) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(String(qty), sx + slotSize - 3, hbY + slotSize - 3);
    }

    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(String(i + 1), sx + slotSize / 2, hbY + slotSize - 4);

    ctx.textAlign = 'left';
  }
}
