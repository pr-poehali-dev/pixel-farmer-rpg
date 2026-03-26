import { HomeUpgrade, Player } from '@/game/types';

interface HomeScreenProps {
  player: Player;
  homeUpgrades: HomeUpgrade[];
  upgradeHome: (id: string) => void;
}

export default function HomeScreen({ player, homeUpgrades, upgradeHome }: HomeScreenProps) {
  return (
    <div className="screen-container">
      <div className="screen-title">🏡 Мой Дом</div>

      <div className="home-preview">
        <div className="home-house">🏠</div>
        <div className="home-decorations">
          {homeUpgrades.filter(u => u.level > 0).map(u => (
            <span key={u.id} className="home-deco">{u.emoji}</span>
          ))}
        </div>
      </div>

      <div className="upgrades-list">
        {homeUpgrades.map(upgrade => {
          const nextPrice = upgrade.price * (upgrade.level + 1);
          const isMax = upgrade.level >= upgrade.maxLevel;
          const canAfford = player.gold >= nextPrice;
          return (
            <div key={upgrade.id} className={`upgrade-card ${isMax ? 'upgrade-max' : ''}`}>
              <div className="upgrade-emoji">{upgrade.emoji}</div>
              <div className="upgrade-info">
                <div className="upgrade-name">{upgrade.name}</div>
                <div className="upgrade-desc">{upgrade.description}</div>
                <div className="upgrade-progress">
                  {Array.from({ length: upgrade.maxLevel }, (_, i) => (
                    <div key={i} className={`progress-pip ${i < upgrade.level ? 'pip-filled' : ''}`} />
                  ))}
                </div>
              </div>
              <div className="upgrade-right">
                {isMax ? (
                  <div className="upgrade-maxed">МАКС</div>
                ) : (
                  <>
                    <div className="upgrade-next-price">🪙 {nextPrice}</div>
                    <button
                      className={`pixel-btn ${canAfford ? 'pixel-btn-green' : 'pixel-btn-gray'} upgrade-btn`}
                      onClick={() => upgradeHome(upgrade.id)}
                      disabled={!canAfford}
                    >
                      Улучшить
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="home-stats">
        <div className="home-stat">⚔️ ATK: {player.attack}</div>
        <div className="home-stat">🛡️ DEF: {player.defense}</div>
        <div className="home-stat">💨 SPD: {player.speed}</div>
      </div>
    </div>
  );
}
