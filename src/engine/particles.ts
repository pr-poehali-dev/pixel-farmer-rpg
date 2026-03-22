export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export function spawnParticles(
  list: Particle[],
  x: number,
  y: number,
  color: string,
  count = 6,
  speed = 3,
  size = 4,
) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const s = speed * (0.5 + Math.random() * 0.8);
    list.push({
      x, y,
      vx: Math.cos(angle) * s,
      vy: Math.sin(angle) * s - speed * 0.5,
      life: 30 + Math.floor(Math.random() * 20),
      maxLife: 50,
      color,
      size: size * (0.5 + Math.random() * 0.8),
    });
  }
}

export function updateParticles(list: Particle[]): Particle[] {
  return list
    .map(p => ({
      ...p,
      x: p.x + p.vx,
      y: p.y + p.vy,
      vy: p.vy + 0.2,
      vx: p.vx * 0.95,
      life: p.life - 1,
    }))
    .filter(p => p.life > 0);
}
