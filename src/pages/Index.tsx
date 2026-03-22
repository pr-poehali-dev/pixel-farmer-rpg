import { useGameState } from '@/game/useGameState';
import HUD from '@/components/game/HUD';
import NavBar from '@/components/game/NavBar';
import FarmScreen from '@/components/game/FarmScreen';
import BattleScreen from '@/components/game/BattleScreen';
import ShopScreen from '@/components/game/ShopScreen';
import HomeScreen from '@/components/game/HomeScreen';
import CraftScreen from '@/components/game/CraftScreen';

export default function Index() {
  const game = useGameState();

  return (
    <div className="game-root">
      <div className="crt-overlay" />
      <div className="scanlines" />

      <HUD player={game.player} />

      <main className="game-main">
        {game.screen === 'farm' && (
          <FarmScreen
            farm={game.farm}
            selectedCropId={game.selectedCropId}
            setSelectedCropId={game.setSelectedCropId}
            plantCrop={game.plantCrop}
            waterCrop={game.waterCrop}
            harvestCrop={game.harvestCrop}
            getCropStage={game.getCropStage}
          />
        )}
        {game.screen === 'battle' && (
          <BattleScreen
            battle={game.battle}
            player={game.player}
            playerAttack={game.playerAttack}
            fleeFromBattle={game.fleeFromBattle}
            exitBattle={game.exitBattle}
            useItem={game.useItem}
            startBattle={game.startBattle}
          />
        )}
        {game.screen === 'shop' && (
          <ShopScreen
            player={game.player}
            buyItem={game.buyItem}
            sellItem={game.sellItem}
          />
        )}
        {game.screen === 'craft' && (
          <CraftScreen
            player={game.player}
            craftItem={game.craftItem}
          />
        )}
        {game.screen === 'home' && (
          <HomeScreen
            player={game.player}
            homeUpgrades={game.homeUpgrades}
            upgradeHome={game.upgradeHome}
          />
        )}
      </main>

      <NavBar current={game.screen} onNavigate={game.setScreen} />

      {game.notification && (
        <div className="notification-toast">
          {game.notification}
        </div>
      )}
    </div>
  );
}
