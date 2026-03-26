export interface JoystickState {
  active: boolean;
  baseX: number;
  baseY: number;
  x: number;  // -1..1
  y: number;  // -1..1
}

export function createJoystick(): JoystickState {
  return { active: false, baseX: 0, baseY: 0, x: 0, y: 0 };
}

export function drawJoystick(
  ctx: CanvasRenderingContext2D,
  j: JoystickState,
  screenW: number,
  screenH: number,
) {
  if (!j.active) {
    // Ghost
    const bx = 70, by = screenH - 90;
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(bx, by, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    return;
  }

  const RADIUS = 40;
  const cx = j.baseX + j.x * RADIUS;
  const cy = j.baseY + j.y * RADIUS;

  ctx.globalAlpha = 0.4;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(j.baseX, j.baseY, RADIUS + 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 0.7;
  ctx.fillStyle = '#ffd600';
  ctx.beginPath();
  ctx.arc(cx, cy, 20, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 1;
}

export function drawActionButtons(
  ctx: CanvasRenderingContext2D,
  screenW: number,
  screenH: number,
  jumpPressed: boolean,
  attackPressed: boolean,
  placePressed: boolean,
  heavyPressed: boolean,
  stamina: number = 100,
) {
  // Jump button
  const jx = screenW - 55, jy = screenH - 155;
  ctx.globalAlpha = jumpPressed ? 0.9 : 0.5;
  ctx.fillStyle = '#4caf50';
  ctx.beginPath();
  ctx.arc(jx, jy, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('▲', jx, jy + 5);

  // Heavy attack button (top left of right cluster) — тяжёлый удар
  const hx = screenW - 110, hy = screenH - 100;
  const hasStamina = stamina >= 20;
  ctx.globalAlpha = heavyPressed ? 0.95 : 0.6;
  ctx.fillStyle = hasStamina ? '#ff6f00' : '#555';
  ctx.beginPath();
  ctx.arc(hx, hy, 26, 0, Math.PI * 2);
  ctx.fill();
  // Обводка при нехватке стамины
  if (!hasStamina) {
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle = '#ef5350';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(hx, hy, 27, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px monospace';
  ctx.fillText('💥', hx, hy + 5);
  ctx.font = '7px monospace';
  ctx.fillText('СИЛА', hx, hy + 19);

  // Attack button (normal)
  const ax = screenW - 90, ay = screenH - 90;
  ctx.globalAlpha = attackPressed ? 0.9 : 0.55;
  ctx.fillStyle = '#f44336';
  ctx.beginPath();
  ctx.arc(ax, ay, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('⚔', ax, ay + 5);

  // Place button
  const px = screenW - 50, py = screenH - 55;
  ctx.globalAlpha = placePressed ? 0.9 : 0.5;
  ctx.fillStyle = '#2196f3';
  ctx.beginPath();
  ctx.arc(px, py, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px monospace';
  ctx.fillText('□', px, py + 4);

  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

export const ACTION_BTN = {
  jump:   (sw: number, sh: number) => ({ x: sw - 55,  y: sh - 155, r: 32 }),
  heavy:  (sw: number, sh: number) => ({ x: sw - 110, y: sh - 100, r: 32 }),
  attack: (sw: number, sh: number) => ({ x: sw - 90,  y: sh - 90,  r: 32 }),
  place:  (sw: number, sh: number) => ({ x: sw - 50,  y: sh - 55,  r: 28 }),
};