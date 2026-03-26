import { Player, Item } from '@/game/types';
import { SHOP_ITEMS } from '@/game/data';

interface ShopScreenProps {
  player: Player;
  buyItem: (item: Item, price: number) => void;
  sellItem: (itemId: string) => void;
}

export default function ShopScreen({ player, buyItem, sellItem }: ShopScreenProps) {
  const sellableItems = player.inventory.filter(i => i.qty > 0);

  return (
    <div className="screen-container">
      <div className="screen-title">🏪 Лавка NPC</div>
      <div className="npc-banner">
        <span className="npc-sprite">🧙</span>
        <div className="npc-speech">Добро пожаловать, путник! Что тебе нужно?</div>
      </div>

      <div className="shop-tabs-wrapper">
        <div className="shop-section-label">📦 Купить</div>
        <div className="shop-grid">
          {SHOP_ITEMS.map((si, idx) => {
            const locked = si.unlockLevel && player.level < si.unlockLevel;
            const canAfford = player.gold >= si.price;
            return (
              <div key={idx} className={`shop-item ${locked ? 'shop-item-locked' : ''}`}>
                <div className="shop-item-emoji">{si.item.emoji}</div>
                <div className="shop-item-name">{si.item.name}</div>
                {si.unlockLevel && <div className="shop-item-level">Lv.{si.unlockLevel}+</div>}
                <div className="shop-item-price">🪙 {si.price}</div>
                <button
                  className={`pixel-btn ${canAfford && !locked ? 'pixel-btn-green' : 'pixel-btn-gray'} shop-buy-btn`}
                  disabled={!!locked || !canAfford}
                  onClick={() => buyItem(si.item, si.price)}
                >
                  {locked ? '🔒' : 'Купить'}
                </button>
              </div>
            );
          })}
        </div>

        <div className="shop-section-label">💰 Продать</div>
        {sellableItems.length === 0 ? (
          <div className="empty-hint">Нет предметов для продажи</div>
        ) : (
          <div className="sell-grid">
            {sellableItems.map(item => (
              <div key={item.id} className="sell-item">
                <span className="sell-emoji">{item.emoji}</span>
                <span className="sell-name">{item.name}</span>
                <span className="sell-qty">×{item.qty}</span>
                <span className="sell-price">🪙{item.value}</span>
                <button className="pixel-btn pixel-btn-orange sell-btn" onClick={() => sellItem(item.id)}>
                  Продать
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
