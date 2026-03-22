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
) {
  // Jump button (right side, high)
  const jx = screenW - 55, jy = screenH - 140;
  ctx.globalAlpha = jumpPressed ? 0.9 : 0.5;
  ctx.fillStyle = '#4caf50';
  ctx.beginPath();
  ctx.arc(jx, jy, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('▲', jx, jy + 5);

  // Attack button (right side, mid)
  const ax = screenW - 90, ay = screenH - 85;
  ctx.globalAlpha = attackPressed ? 0.9 : 0.5;
  ctx.fillStyle = '#f44336';
  ctx.beginPath();
  ctx.arc(ax, ay, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.fillText('⚔', ax, ay + 5);

  // Place button (right side, bottom)
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
