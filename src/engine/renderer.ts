import { Tile, TILE_DEFS, TILE_SIZE } from './tiles';
import { WORLD_W, WORLD_H } from './worldgen';
import { Player } from './player';
import { Enemy, EnemyType } from './enemies';
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
  stamina: number,
  maxStamina: number,
  showSleepBtn: boolean,
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
  drawHUD(ctx, screenW, screenH, inventory, selectedSlot, hp, maxHp, mana, maxMana, level, exp, expNext, stamina, maxStamina, showSleepBtn);
}

function drawPlayer(ctx: CanvasRenderingContext2D, player: Player, x: number, y: number, time: number) {
  const { w, h, facingRight, onGround, vx, attackAnim, heavyAttackAnim } = player;
  const walking = onGround && Math.abs(vx) > 0.5;
  const legSwing = walking ? Math.sin(time * 0.012) * 9 : 0;
  const armSwing = walking ? Math.sin(time * 0.012) * 11 : 0;
  const isAttacking = (attackAnim ?? 0) > 0;
  const isHeavy = (heavyAttackAnim ?? 0) > 0;

  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  if (!facingRight) ctx.scale(-1, 1);

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(0, h / 2 + 2, 14, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // --- LEGS ---
  ctx.fillStyle = '#37474f'; // темно-серые штаны
  ctx.fillRect(-9, 3 + legSwing, 8, 13);
  ctx.fillRect(1,  3 - legSwing, 8, 13);
  // Boots
  ctx.fillStyle = '#4e342e';
  ctx.fillRect(-10, 14 + legSwing, 9, 5);
  ctx.fillRect(1,   14 - legSwing, 9, 5);
  // Boot tip
  ctx.fillStyle = '#3e2723';
  ctx.fillRect(-10, 18 + legSwing, 9, 1);
  ctx.fillRect(1,   18 - legSwing, 9, 1);

  // --- BODY (кожаный нагрудник) ---
  ctx.fillStyle = '#546e7a';
  ctx.fillRect(-9, -12, 18, 16);
  // Нагрудник
  ctx.fillStyle = '#8d6e63';
  ctx.fillRect(-8, -11, 16, 14);
  ctx.fillStyle = '#a1887f';
  ctx.fillRect(-6, -9, 6, 10); // левая пластина
  ctx.fillRect(1,  -9, 6, 10); // правая пластина
  // Пояс
  ctx.fillStyle = '#5d4037';
  ctx.fillRect(-9, 3, 18, 3);
  ctx.fillStyle = '#ffd600';
  ctx.fillRect(-2, 3, 4, 3); // пряжка

  // --- LEFT ARM (задний план — без атаки) ---
  const leftArmY = isAttacking ? -armSwing - 5 : -8 - armSwing;
  ctx.fillStyle = '#ffcc80';
  ctx.fillRect(-15, leftArmY, 6, 13);
  // Рукав
  ctx.fillStyle = '#8d6e63';
  ctx.fillRect(-15, leftArmY, 6, 5);

  // --- RIGHT ARM + WEAPON ---
  ctx.save();
  if (isHeavy) {
    // Тяжёлый удар — рука поднята и рубит вниз
    const prog = 1 - (heavyAttackAnim ?? 0) / 250;
    const angle = -Math.PI * 0.8 + prog * Math.PI * 1.2;
    ctx.translate(10, -6);
    ctx.rotate(angle);
    ctx.fillStyle = '#ffcc80';
    ctx.fillRect(-3, 0, 6, 12);
    ctx.fillStyle = '#8d6e63';
    ctx.fillRect(-3, 0, 6, 5);
    // Меч (большой, красный)
    ctx.fillStyle = '#ef9a9a';
    ctx.fillRect(-2, -28, 4, 28);
    ctx.fillStyle = '#e53935';
    ctx.fillRect(-1, -28, 2, 24);
    ctx.fillStyle = '#ffd600';
    ctx.fillRect(-6, -10, 12, 3); // гарда
    ctx.fillStyle = '#bdbdbd';
    ctx.fillRect(-2, -28, 4, 4); // навершие
    // Вспышка удара
    if (prog > 0.7) {
      ctx.fillStyle = 'rgba(255,100,0,0.6)';
      ctx.beginPath();
      ctx.arc(0, -28, 14 * (prog - 0.7) / 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (isAttacking) {
    // Обычный удар — быстрый взмах
    const prog = 1 - (attackAnim ?? 0) / 180;
    const angle = -Math.PI * 0.5 + prog * Math.PI * 0.9;
    ctx.translate(10, -6);
    ctx.rotate(angle);
    ctx.fillStyle = '#ffcc80';
    ctx.fillRect(-3, 0, 6, 12);
    ctx.fillStyle = '#8d6e63';
    ctx.fillRect(-3, 0, 6, 5);
    // Меч
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(-2, -24, 4, 24);
    ctx.fillStyle = '#fff';
    ctx.fillRect(-1, -24, 2, 20);
    ctx.fillStyle = '#ffd600';
    ctx.fillRect(-5, -8, 10, 3);
    // Блеск
    if (prog > 0.5) {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.arc(0, -24, 8 * (prog - 0.5) / 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Обычное состояние — рука с мечом
    ctx.fillStyle = '#ffcc80';
    ctx.fillRect(9, -8 + armSwing, 6, 13);
    ctx.fillStyle = '#8d6e63';
    ctx.fillRect(9, -8 + armSwing, 6, 5);
    // Меч в руке
    ctx.fillStyle = '#bdbdbd';
    ctx.fillRect(13, -18 + armSwing, 3, 18);
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(14, -18 + armSwing, 1, 16);
    ctx.fillStyle = '#ffd600';
    ctx.fillRect(10, -10 + armSwing, 9, 2);
  }
  ctx.restore();

  // --- HEAD ---
  // Шея
  ctx.fillStyle = '#ffb74d';
  ctx.fillRect(-4, -14, 8, 4);
  // Голова (лицо)
  ctx.fillStyle = '#ffcc80';
  ctx.fillRect(-10, -32, 20, 18);
  // Щёки румяные
  ctx.fillStyle = 'rgba(255,100,100,0.25)';
  ctx.fillRect(-9, -23, 5, 4);
  ctx.fillRect(4,  -23, 5, 4);
  // Глаза (белки)
  ctx.fillStyle = '#fff';
  ctx.fillRect(-7, -27, 5, 6);
  ctx.fillRect(2,  -27, 5, 6);
  // Зрачки
  ctx.fillStyle = '#1565c0';
  ctx.fillRect(-6, -26, 3, 4);
  ctx.fillRect(3,  -26, 3, 4);
  ctx.fillStyle = '#000';
  ctx.fillRect(-5, -25, 2, 3);
  ctx.fillRect(4,  -25, 2, 3);
  // Блик
  ctx.fillStyle = '#fff';
  ctx.fillRect(-4, -25, 1, 1);
  ctx.fillRect(5,  -25, 1, 1);
  // Нос
  ctx.fillStyle = '#ffb74d';
  ctx.fillRect(-1, -22, 3, 3);
  // Рот
  ctx.fillStyle = '#e57373';
  ctx.fillRect(-3, -19, 6, 2);
  // Волосы
  ctx.fillStyle = '#5d4037';
  ctx.fillRect(-10, -32, 20, 6);
  ctx.fillRect(-10, -32, 4, 11);
  // Чёлка
  ctx.fillStyle = '#795548';
  ctx.fillRect(-6, -32, 16, 3);
  // Шлем / шапка
  ctx.fillStyle = '#3f51b5';
  ctx.fillRect(-11, -35, 22, 5);
  ctx.fillRect(-7, -42, 14, 8);
  ctx.fillStyle = '#5c6bc0';
  ctx.fillRect(-5, -40, 10, 5);

  ctx.restore();
}

function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy, x: number, y: number, time: number) {
  ctx.save();
  ctx.translate(x + e.w / 2, y + e.h / 2);
  if (!e.facingRight) ctx.scale(-1, 1);

  const bob = Math.sin(time * 0.005 + e.x * 0.01) * 3;
  const flash = e.hitFlash;

  // HP bar
  const barW = Math.max(36, e.w + 4);
  const barH = 5;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(-barW / 2 - 1, -e.h / 2 - 14 + bob, barW + 2, barH + 2);
  ctx.fillStyle = '#c62828';
  ctx.fillRect(-barW / 2, -e.h / 2 - 13 + bob, barW, barH);
  ctx.fillStyle = '#ef5350';
  ctx.fillRect(-barW / 2, -e.h / 2 - 13 + bob, barW * (e.hp / e.maxHp), barH);

  if (e.type === 'slime') {
    drawSlime(ctx, bob, flash);
  } else if (e.type === 'zombie') {
    drawZombie(ctx, bob, flash, time);
  } else if (e.type === 'skeleton') {
    drawSkeleton(ctx, bob, flash);
  } else if (e.type === 'goblin') {
    drawGoblin(ctx, bob, flash, time);
  } else if (e.type === 'troll') {
    drawTroll(ctx, bob, flash, time);
  } else if (e.type === 'bat') {
    drawBat(ctx, bob, flash, time);
  }

  ctx.restore();
}

function drawSlime(ctx: CanvasRenderingContext2D, bob: number, flash: boolean) {
  // Тело — большой пузырь
  ctx.fillStyle = flash ? '#ff5252' : '#43a047';
  ctx.beginPath();
  ctx.ellipse(0, 4 + bob, 17, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  // Блик на теле
  ctx.fillStyle = flash ? 'rgba(255,200,200,0.4)' : 'rgba(200,255,200,0.4)';
  ctx.beginPath();
  ctx.ellipse(-5, -1 + bob, 7, 5, -0.4, 0, Math.PI * 2);
  ctx.fill();
  // Тёмный контур снизу
  ctx.fillStyle = flash ? '#c62828' : '#2e7d32';
  ctx.beginPath();
  ctx.ellipse(0, 10 + bob, 14, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Глаза — белки
  ctx.fillStyle = '#fff';
  ctx.fillRect(-8, -3 + bob, 6, 7);
  ctx.fillRect(2,  -3 + bob, 6, 7);
  // Радужка
  ctx.fillStyle = '#000d';
  ctx.fillRect(-7, -2 + bob, 4, 5);
  ctx.fillRect(3,  -2 + bob, 4, 5);
  // Зрачок
  ctx.fillStyle = '#1a237e';
  ctx.fillRect(-6, -1 + bob, 2, 3);
  ctx.fillRect(4,  -1 + bob, 2, 3);
  // Блик глаза
  ctx.fillStyle = '#fff';
  ctx.fillRect(-6, -2 + bob, 1, 1);
  ctx.fillRect(4,  -2 + bob, 1, 1);
  // Рот
  ctx.fillStyle = '#1b5e20';
  ctx.fillRect(-5, 6 + bob, 10, 2);
  ctx.fillRect(-3, 8 + bob, 6, 2);
}

function drawZombie(ctx: CanvasRenderingContext2D, bob: number, flash: boolean, time: number) {
  const walk = Math.sin(time * 0.008) * 6;
  // Ноги
  ctx.fillStyle = flash ? '#e53935' : '#2e7d32';
  ctx.fillRect(-9, 10 + bob + walk, 8, 14);
  ctx.fillRect(1,  10 + bob - walk, 8, 14);
  // Ботинки
  ctx.fillStyle = flash ? '#b71c1c' : '#1b5e20';
  ctx.fillRect(-10, 22 + bob + walk, 10, 4);
  ctx.fillRect(0,   22 + bob - walk, 10, 4);
  // Туловище (лохмотья)
  ctx.fillStyle = flash ? '#e53935' : '#558b2f';
  ctx.fillRect(-10, -5 + bob, 20, 16);
  // Дыры на теле
  ctx.fillStyle = flash ? '#c62828' : '#33691e';
  ctx.fillRect(-7, -2 + bob, 4, 5);
  ctx.fillRect(3,  1 + bob,  5, 4);
  ctx.fillRect(-2, 6 + bob,  4, 3);
  // Руки вытянуты
  ctx.fillStyle = flash ? '#ef9a9a' : '#aed581';
  ctx.fillRect(-20, -4 + bob, 11, 7);
  ctx.fillRect(9,   -4 + bob, 11, 7);
  // Кулаки
  ctx.fillStyle = flash ? '#e57373' : '#8bc34a';
  ctx.fillRect(-21, -3 + bob, 6, 5);
  ctx.fillRect(15,  -3 + bob, 6, 5);
  // Шея
  ctx.fillStyle = flash ? '#ef9a9a' : '#c5e1a5';
  ctx.fillRect(-4, -9 + bob, 8, 5);
  // Голова
  ctx.fillStyle = flash ? '#ef9a9a' : '#aed581';
  ctx.fillRect(-9, -25 + bob, 18, 17);
  // Разложение на голове
  ctx.fillStyle = flash ? '#e53935' : '#7cb342';
  ctx.fillRect(-8, -25 + bob, 5, 4);
  ctx.fillRect(4,  -24 + bob, 4, 3);
  // Глаза зомби — пустые
  ctx.fillStyle = flash ? '#fff' : '#f44336';
  ctx.fillRect(-6, -20 + bob, 5, 5);
  ctx.fillRect(1,  -20 + bob, 5, 5);
  ctx.fillStyle = '#fff';
  ctx.fillRect(-5, -19 + bob, 3, 3);
  ctx.fillRect(2,  -19 + bob, 3, 3);
  ctx.fillStyle = '#000';
  ctx.fillRect(-4, -19 + bob, 2, 2);
  ctx.fillRect(3,  -19 + bob, 2, 2);
  // Рот (кровь)
  ctx.fillStyle = '#b71c1c';
  ctx.fillRect(-5, -13 + bob, 10, 3);
  ctx.fillRect(-3, -10 + bob, 6, 2);
  ctx.fillStyle = '#fff';
  ctx.fillRect(-4, -13 + bob, 3, 2);
  ctx.fillRect(1,  -13 + bob, 3, 2);
}

function drawSkeleton(ctx: CanvasRenderingContext2D, bob: number, flash: boolean) {
  const c = flash ? '#ff5252' : '#f5f5f5';
  const dark = flash ? '#b71c1c' : '#9e9e9e';
  // Ноги
  ctx.fillStyle = c;
  ctx.fillRect(-8, 12 + bob, 5, 14);
  ctx.fillRect(3,  12 + bob, 5, 14);
  // Суставы ног
  ctx.fillStyle = dark;
  ctx.fillRect(-7, 18 + bob, 5, 3);
  ctx.fillRect(3,  18 + bob, 5, 3);
  ctx.fillRect(-7, 24 + bob, 4, 3);
  ctx.fillRect(4,  24 + bob, 4, 3);
  // Таз
  ctx.fillStyle = c;
  ctx.fillRect(-10, 9 + bob, 20, 5);
  // Позвоночник
  ctx.fillStyle = c;
  ctx.fillRect(-2, -6 + bob, 4, 16);
  // Рёбра
  for (let r = 0; r < 4; r++) {
    ctx.fillStyle = r % 2 === 0 ? c : dark;
    ctx.fillRect(-10, -4 + r * 4 + bob, 20, 2);
  }
  // Плечи
  ctx.fillStyle = c;
  ctx.fillRect(-12, -6 + bob, 24, 4);
  // Руки
  ctx.fillRect(-14, -2 + bob, 4, 12);
  ctx.fillRect(10,  -2 + bob, 4, 12);
  // Рука с мечом (правая)
  ctx.fillStyle = '#bdbdbd'; // меч
  ctx.fillRect(12, -20 + bob, 3, 22);
  ctx.fillStyle = '#e0e0e0';
  ctx.fillRect(13, -20 + bob, 1, 20);
  ctx.fillStyle = '#ffd600';
  ctx.fillRect(8, -10 + bob, 11, 3);
  ctx.fillStyle = dark;
  ctx.fillRect(11, -20 + bob, 5, 3);
  // Череп
  ctx.fillStyle = c;
  ctx.fillRect(-10, -26 + bob, 20, 18);
  // Скулы
  ctx.fillStyle = dark;
  ctx.fillRect(-10, -12 + bob, 4, 4);
  ctx.fillRect(6,   -12 + bob, 4, 4);
  // Глазницы
  ctx.fillStyle = '#000';
  ctx.fillRect(-7, -22 + bob, 6, 6);
  ctx.fillRect(1,  -22 + bob, 6, 6);
  // Свечение в глазницах
  ctx.fillStyle = flash ? '#ff5252' : '#76ff03';
  ctx.fillRect(-6, -21 + bob, 4, 4);
  ctx.fillRect(2,  -21 + bob, 4, 4);
  // Нос (впадина)
  ctx.fillStyle = '#000';
  ctx.fillRect(-2, -16 + bob, 4, 4);
  // Зубы
  ctx.fillStyle = '#fff';
  ctx.fillRect(-6, -10 + bob, 3, 3);
  ctx.fillRect(-2, -10 + bob, 3, 3);
  ctx.fillRect(2,  -10 + bob, 3, 3);
  ctx.fillStyle = dark;
  ctx.fillRect(-5, -8 + bob, 1, 1);
  ctx.fillRect(-1, -8 + bob, 1, 1);
  ctx.fillRect(3,  -8 + bob, 1, 1);
}

function drawGoblin(ctx: CanvasRenderingContext2D, bob: number, flash: boolean, time: number) {
  const walk = Math.sin(time * 0.014) * 5;
  const skin = flash ? '#ff5252' : '#66bb6a';
  const dark = flash ? '#b71c1c' : '#388e3c';
  // Ноги короткие
  ctx.fillStyle = dark;
  ctx.fillRect(-7, 7 + bob + walk, 6, 10);
  ctx.fillRect(1,  7 + bob - walk, 6, 10);
  // Туловище маленькое
  ctx.fillStyle = skin;
  ctx.fillRect(-8, -5 + bob, 16, 13);
  // Одежда гоблина
  ctx.fillStyle = '#5d4037';
  ctx.fillRect(-7, -4 + bob, 14, 10);
  ctx.fillStyle = '#795548';
  ctx.fillRect(-6, -3 + bob, 5, 7);
  ctx.fillRect(1,  -3 + bob, 5, 7);
  // Руки с когтями
  ctx.fillStyle = skin;
  ctx.fillRect(-14, -3 + bob, 7, 8);
  ctx.fillRect(7,   -3 + bob, 7, 8);
  // Когти
  ctx.fillStyle = dark;
  ctx.fillRect(-14, 4 + bob, 3, 4);
  ctx.fillRect(-11, 4 + bob, 3, 4);
  ctx.fillRect(8,   4 + bob, 3, 4);
  ctx.fillRect(11,  4 + bob, 3, 4);
  // Голова большая для тела
  ctx.fillStyle = skin;
  ctx.fillRect(-10, -21 + bob, 20, 17);
  // Уши большие
  ctx.fillStyle = skin;
  ctx.fillRect(-15, -19 + bob, 6, 8);
  ctx.fillRect(9,   -19 + bob, 6, 8);
  ctx.fillStyle = dark;
  ctx.fillRect(-14, -18 + bob, 4, 5);
  ctx.fillRect(10,  -18 + bob, 4, 5);
  // Нос крючком
  ctx.fillStyle = dark;
  ctx.fillRect(-3, -14 + bob, 6, 4);
  ctx.fillRect(1,  -12 + bob, 3, 4);
  // Глаза жёлтые злобные
  ctx.fillStyle = flash ? '#fff' : '#ffee58';
  ctx.fillRect(-7, -18 + bob, 5, 5);
  ctx.fillRect(2,  -18 + bob, 5, 5);
  ctx.fillStyle = '#f57f17';
  ctx.fillRect(-6, -17 + bob, 3, 3);
  ctx.fillRect(3,  -17 + bob, 3, 3);
  ctx.fillStyle = '#000';
  ctx.fillRect(-5, -17 + bob, 2, 2);
  ctx.fillRect(4,  -17 + bob, 2, 2);
  // Рот с зубами
  ctx.fillStyle = '#000';
  ctx.fillRect(-5, -9 + bob, 10, 4);
  ctx.fillStyle = '#fff';
  ctx.fillRect(-4, -8 + bob, 3, 3);
  ctx.fillRect(0,  -8 + bob, 3, 3);
  // Шапка
  ctx.fillStyle = '#4a148c';
  ctx.fillRect(-8, -23 + bob, 16, 4);
  ctx.fillRect(-5, -30 + bob, 10, 8);
  ctx.fillStyle = '#7b1fa2';
  ctx.fillRect(-4, -29 + bob, 8, 6);
}

function drawTroll(ctx: CanvasRenderingContext2D, bob: number, flash: boolean, time: number) {
  const breath = Math.sin(time * 0.003) * 2;
  const skin = flash ? '#ff5252' : '#78909c';
  const dark = flash ? '#b71c1c' : '#455a64';
  // Ноги огромные
  ctx.fillStyle = dark;
  ctx.fillRect(-14, 15 + bob, 12, 16);
  ctx.fillRect(2,   15 + bob, 12, 16);
  ctx.fillRect(-16, 29 + bob, 14, 5); // ступни
  ctx.fillRect(2,   29 + bob, 14, 5);
  // Туловище массивное
  ctx.fillStyle = skin;
  ctx.fillRect(-16, -10 + bob + breath, 32, 26);
  // Детали тела
  ctx.fillStyle = dark;
  ctx.fillRect(-14, -8 + bob, 6, 10);
  ctx.fillRect(4,   -5 + bob, 8, 8);
  ctx.fillRect(-5,  5 + bob,  10, 6);
  // Руки огромные
  ctx.fillStyle = skin;
  ctx.fillRect(-30, -8 + bob, 15, 20);
  ctx.fillRect(15,  -8 + bob, 15, 20);
  // Кулаки
  ctx.fillStyle = dark;
  ctx.fillRect(-31, 10 + bob, 16, 8);
  ctx.fillRect(15,  10 + bob, 16, 8);
  // Пальцы
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = skin;
    ctx.fillRect(-31 + i * 4, 17 + bob, 3, 5);
    ctx.fillRect(15 + i * 4, 17 + bob, 3, 5);
  }
  // Голова
  ctx.fillStyle = skin;
  ctx.fillRect(-15, -30 + bob, 30, 22);
  // Брови нахмуренные
  ctx.fillStyle = dark;
  ctx.fillRect(-13, -28 + bob, 10, 4);
  ctx.fillRect(3,   -28 + bob, 10, 4);
  // Глаза маленькие злобные
  ctx.fillStyle = flash ? '#fff' : '#ef5350';
  ctx.fillRect(-10, -24 + bob, 7, 6);
  ctx.fillRect(3,   -24 + bob, 7, 6);
  ctx.fillStyle = '#b71c1c';
  ctx.fillRect(-9, -23 + bob, 5, 4);
  ctx.fillRect(4,  -23 + bob, 5, 4);
  ctx.fillStyle = '#000';
  ctx.fillRect(-8, -22 + bob, 3, 3);
  ctx.fillRect(5,  -22 + bob, 3, 3);
  // Нос огромный
  ctx.fillStyle = dark;
  ctx.fillRect(-4, -20 + bob, 8, 7);
  ctx.fillRect(-6, -16 + bob, 12, 4);
  // Рот
  ctx.fillStyle = '#000';
  ctx.fillRect(-10, -11 + bob, 20, 5);
  ctx.fillStyle = '#e53935';
  ctx.fillRect(-9, -10 + bob, 18, 3);
  // Клыки
  ctx.fillStyle = '#fff8';
  ctx.fillRect(-8, -10 + bob, 4, 5);
  ctx.fillRect(-2, -10 + bob, 4, 5);
  ctx.fillRect(4,  -10 + bob, 4, 5);
  // Рога
  ctx.fillStyle = dark;
  ctx.fillRect(-16, -35 + bob, 5, 8);
  ctx.fillRect(11,  -35 + bob, 5, 8);
  ctx.fillStyle = '#546e7a';
  ctx.fillRect(-14, -40 + bob, 3, 7);
  ctx.fillRect(11,  -40 + bob, 3, 7);
}

function drawBat(ctx: CanvasRenderingContext2D, bob: number, flash: boolean, time: number) {
  const wingFlap = Math.sin(time * 0.025) * 12;
  const body = flash ? '#ff5252' : '#6a1b9a';
  const wing = flash ? '#b71c1c' : '#4a148c';
  // Крылья
  ctx.fillStyle = wing;
  // Левое крыло
  ctx.save();
  ctx.translate(-12, -2 + bob);
  ctx.rotate(-wingFlap * Math.PI / 180);
  ctx.fillRect(-18, -2, 20, 10);
  ctx.fillStyle = '#7b1fa2';
  ctx.fillRect(-16, -1, 14, 6);
  // Перепонки
  ctx.fillStyle = wing + '99';
  ctx.fillRect(-18, 3, 20, 6);
  ctx.restore();
  // Правое крыло
  ctx.save();
  ctx.translate(12, -2 + bob);
  ctx.rotate(wingFlap * Math.PI / 180);
  ctx.fillRect(-2, -2, 20, 10);
  ctx.fillStyle = '#7b1fa2';
  ctx.fillRect(2, -1, 14, 6);
  ctx.fillStyle = wing + '99';
  ctx.fillRect(-2, 3, 20, 6);
  ctx.restore();
  // Тело
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(0, 2 + bob, 10, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Голова
  ctx.fillStyle = body;
  ctx.fillRect(-8, -10 + bob, 16, 12);
  // Уши
  ctx.fillStyle = body;
  ctx.fillRect(-9, -18 + bob, 5, 10);
  ctx.fillRect(4,  -18 + bob, 5, 10);
  ctx.fillStyle = '#ce93d8';
  ctx.fillRect(-8, -17 + bob, 3, 7);
  ctx.fillRect(5,  -17 + bob, 3, 7);
  // Глаза красные
  ctx.fillStyle = flash ? '#fff' : '#ef5350';
  ctx.fillRect(-6, -8 + bob, 5, 4);
  ctx.fillRect(1,  -8 + bob, 5, 4);
  ctx.fillStyle = '#b71c1c';
  ctx.fillRect(-5, -7 + bob, 3, 3);
  ctx.fillRect(2,  -7 + bob, 3, 3);
  ctx.fillStyle = '#fff';
  ctx.fillRect(-4, -8 + bob, 1, 1);
  ctx.fillRect(3,  -8 + bob, 1, 1);
  // Клыки
  ctx.fillStyle = '#fff';
  ctx.fillRect(-4, -2 + bob, 3, 4);
  ctx.fillRect(1,  -2 + bob, 3, 4);
  ctx.fillStyle = '#e91e63';
  ctx.fillRect(-3, -1 + bob, 2, 3);
  ctx.fillRect(2,  -1 + bob, 2, 3);
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
  stamina: number, maxStamina: number,
  showSleepBtn: boolean,
) {
  // Top bars
  const barW = 130, barH = 10;
  const pad = 10;

  // Панель фона баров
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(pad - 2, pad - 2, barW + 10, barH * 4 + 50);

  // HP
  ctx.fillStyle = '#b71c1c';
  ctx.fillRect(pad + 2, pad + 2, barW, barH);
  ctx.fillStyle = '#f44336';
  ctx.fillRect(pad + 2, pad + 2, barW * Math.max(0, hp / maxHp), barH);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 9px monospace';
  ctx.fillText(`♥ ${Math.ceil(hp)}/${maxHp}`, pad + 6, pad + 11);

  // Mana
  ctx.fillStyle = '#0d47a1';
  ctx.fillRect(pad + 2, pad + 16, barW, barH);
  ctx.fillStyle = '#2196f3';
  ctx.fillRect(pad + 2, pad + 16, barW * Math.max(0, mana / maxMana), barH);
  ctx.fillStyle = '#adf';
  ctx.fillText(`✦ ${Math.ceil(mana)}/${maxMana}`, pad + 6, pad + 25);

  // Stamina (жёлтая)
  const stPct = Math.max(0, stamina / maxStamina);
  ctx.fillStyle = '#5d4037';
  ctx.fillRect(pad + 2, pad + 30, barW, barH);
  ctx.fillStyle = stPct > 0.3 ? '#ffd600' : stPct > 0.1 ? '#ff8f00' : '#e53935';
  ctx.fillRect(pad + 2, pad + 30, barW * stPct, barH);
  ctx.fillStyle = stPct > 0.3 ? '#ffd600' : '#ff8f00';
  ctx.fillText(`⚡ ${Math.ceil(stamina)}/${maxStamina}`, pad + 6, pad + 39);

  // Level & EXP
  ctx.fillStyle = '#e65100';
  ctx.fillRect(pad + 2, pad + 44, barW, barH);
  ctx.fillStyle = '#ff9800';
  ctx.fillRect(pad + 2, pad + 44, barW * (exp / expNext), barH);
  ctx.fillStyle = '#ffd600';
  ctx.fillText(`Lv.${level} EXP ${exp}/${expNext}`, pad + 4, pad + 53);

  // Кнопка "Спать" если нет стамины
  if (showSleepBtn) {
    const bx = sw - 110, by = sh / 2 - 60;
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(bx, by, 100, 120);
    ctx.strokeStyle = '#ffd600';
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, 100, 120);
    ctx.fillStyle = '#ffd600';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('УСТАЛОСТЬ!', bx + 50, by + 20);
    ctx.fillStyle = '#fff';
    ctx.font = '8px monospace';
    ctx.fillText('Нет энергии для', bx + 50, by + 36);
    ctx.fillText('тяжёлых атак', bx + 50, by + 50);
    ctx.fillText('Нажми [E] или', bx + 50, by + 68);
    ctx.fillText('кнопку чтобы', bx + 50, by + 80);
    ctx.fillText('ПОСПАТЬ', bx + 50, by + 96);
    ctx.fillStyle = '#1565c0';
    ctx.fillRect(bx + 10, by + 102, 80, 14);
    ctx.fillStyle = '#fff';
    ctx.fillText('💤 Спать', bx + 50, by + 113);
    ctx.textAlign = 'left';
  }

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