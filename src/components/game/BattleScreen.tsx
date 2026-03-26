import { BattleState, Player } from '@/game/types';

interface BattleScreenProps {
  battle: BattleState;
  player: Player;
  playerAttack: (type: 'normal' | 'heavy' | 'magic') => void;
  fleeFromBattle: () => void;
  exitBattle: () => void;
  useItem: (id: string) => void;
  startBattle: () => void;
}

export default function BattleScreen({ battle, player, playerAttack, fleeFromBattle, exitBattle, useItem, startBattle }: BattleScreenProps) {
  const potions = player.inventory.filter(i => i.type === 'potion' && i.qty > 0);

  if (battle.phase === 'idle') {
    return (
      <div className="screen-container battle-idle">
        <div className="screen-title">⚔️ Поле Боя</div>
        <div className="battle-world">
          <div className="battle-landscape">🌲🌲🏔️🌲🌲</div>
          <div className="idle-enemies">
            <div className="idle-enemy">👺</div>
            <div className="idle-enemy delay-1">🐺</div>
            <div className="idle-enemy delay-2">👹</div>
          </div>
        </div>
        <div className="idle-info">Атакуй монстров и получай опыт и золото!</div>
        <button className="pixel-btn pixel-btn-red battle-start-btn" onClick={startBattle}>
          ⚔️ В БОЙ!
        </button>
      </div>
    );
  }

  if (battle.phase === 'victory' || battle.phase === 'defeat') {
    return (
      <div className="screen-container battle-end">
        <div className={`battle-result ${battle.phase === 'victory' ? 'victory' : 'defeat'}`}>
          {battle.phase === 'victory' ? '🏆 ПОБЕДА!' : '💀 ПОРАЖЕНИЕ'}
        </div>
        <div className="battle-log-final">
          {battle.log.slice(-3).map((msg, i) => (
            <div key={i} className="log-entry">{msg}</div>
          ))}
        </div>
        <div className="battle-end-buttons">
          <button className="pixel-btn pixel-btn-green" onClick={startBattle}>
            ⚔️ Ещё раз!
          </button>
          <button className="pixel-btn pixel-btn-gray" onClick={exitBattle}>
            🏠 На ферму
          </button>
        </div>
      </div>
    );
  }

  const enemy = battle.enemy!;
  const enemyHpPct = Math.max(0, (enemy.hp / enemy.maxHp) * 100);
  const playerHpPct = Math.max(0, (player.hp / player.maxHp) * 100);

  return (
    <div className="screen-container battle-active">
      <div className="battle-arena">
        <div className="fighter fighter-enemy">
          <div className="fighter-name">{enemy.name}</div>
          <div className="fighter-bar-wrap">
            <div className="fighter-bar enemy-bar" style={{ width: `${enemyHpPct}%` }} />
          </div>
          <div className="fighter-hp">{enemy.hp}/{enemy.maxHp}</div>
          <div className="fighter-sprite enemy-sprite">
            <span className="sprite-big">{enemy.emoji}</span>
          </div>
        </div>

        <div className="battle-vs">VS</div>

        <div className="fighter fighter-player">
          <div className="fighter-sprite player-sprite">
            <span className="sprite-big">🧑‍🌾</span>
          </div>
          <div className="fighter-name">Фермер</div>
          <div className="fighter-bar-wrap">
            <div className="fighter-bar player-bar" style={{ width: `${playerHpPct}%` }} />
          </div>
          <div className="fighter-hp">{player.hp}/{player.maxHp}</div>
        </div>
      </div>

      {battle.combo > 1 && (
        <div className="combo-display">⚡ КОМБО x{battle.combo}</div>
      )}

      <div className="battle-log">
        {battle.log.slice(-4).map((msg, i) => (
          <div key={i} className="log-entry" style={{ opacity: 0.5 + i * 0.17 }}>{msg}</div>
        ))}
      </div>

      <div className="battle-controls">
        <button
          className="pixel-btn pixel-btn-red battle-btn"
          onClick={() => playerAttack('normal')}
          disabled={!battle.playerTurn || battle.animating}
        >
          🗡️ Атака
        </button>
        <button
          className="pixel-btn pixel-btn-orange battle-btn"
          onClick={() => playerAttack('heavy')}
          disabled={!battle.playerTurn || battle.animating}
        >
          💥 Тяжёлый
        </button>
        <button
          className={`pixel-btn pixel-btn-blue battle-btn ${player.mp < 10 ? 'btn-disabled' : ''}`}
          onClick={() => playerAttack('magic')}
          disabled={!battle.playerTurn || battle.animating || player.mp < 10}
        >
          ✨ Магия
        </button>
      </div>

      <div className="battle-secondary">
        {potions.map(p => (
          <button key={p.id} className="pixel-btn pixel-btn-green potion-btn" onClick={() => useItem(p.id)}>
            {p.emoji} ×{p.qty}
          </button>
        ))}
        <button className="pixel-btn pixel-btn-gray flee-btn" onClick={fleeFromBattle}>
          🏃 Бежать
        </button>
      </div>
    </div>
  );
}
