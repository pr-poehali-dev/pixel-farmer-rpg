import { Player } from '@/game/types';

interface HUDProps {
  player: Player;
}

const PixelBar = ({ value, max, color }: { value: number; max: number; color: string }) => {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="pixel-bar-bg">
      <div className="pixel-bar-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
};

export default function HUD({ player }: HUDProps) {
  return (
    <div className="hud-panel">
      <div className="hud-avatar">🧑‍🌾</div>
      <div className="hud-info">
        <div className="hud-name">{player.name} <span className="hud-level">Lv.{player.level}</span></div>
        <div className="hud-bars">
          <div className="hud-bar-row">
            <span className="hud-bar-label">HP</span>
            <PixelBar value={player.hp} max={player.maxHp} color="#e74c3c" />
            <span className="hud-bar-val">{player.hp}/{player.maxHp}</span>
          </div>
          <div className="hud-bar-row">
            <span className="hud-bar-label">MP</span>
            <PixelBar value={player.mp} max={player.maxMp} color="#3498db" />
            <span className="hud-bar-val">{player.mp}/{player.maxMp}</span>
          </div>
          <div className="hud-bar-row">
            <span className="hud-bar-label">EXP</span>
            <PixelBar value={player.exp} max={player.expToNext} color="#f1c40f" />
            <span className="hud-bar-val">{player.exp}/{player.expToNext}</span>
          </div>
        </div>
      </div>
      <div className="hud-gold">🪙 {player.gold}</div>
    </div>
  );
}
