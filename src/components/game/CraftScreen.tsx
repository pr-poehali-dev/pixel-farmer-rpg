import { Player, CraftRecipe } from '@/game/types';
import { CRAFT_RECIPES } from '@/game/data';

interface CraftScreenProps {
  player: Player;
  craftItem: (recipeId: string, recipe: CraftRecipe) => void;
}

export default function CraftScreen({ player, craftItem }: CraftScreenProps) {
  const canCraft = (recipe: CraftRecipe) => {
    if (player.level < recipe.requiredLevel) return false;
    return recipe.ingredients.every(ing => {
      const have = player.inventory.find(i => i.id === ing.item.id);
      return have && have.qty >= ing.qty;
    });
  };

  return (
    <div className="screen-container">
      <div className="screen-title">⚗️ Крафтинг</div>

      <div className="craft-lab">
        <div className="craft-table-emoji">🧪</div>
        <div className="craft-subtitle">Создавай зелья и предметы из ресурсов</div>
      </div>

      <div className="craft-recipes">
        {CRAFT_RECIPES.map(recipe => {
          const craftable = canCraft(recipe);
          const locked = player.level < recipe.requiredLevel;
          return (
            <div key={recipe.id} className={`recipe-card ${craftable ? 'recipe-ready' : ''} ${locked ? 'recipe-locked' : ''}`}>
              <div className="recipe-result">
                <span className="recipe-emoji">{recipe.emoji}</span>
                <span className="recipe-name">{recipe.name}</span>
                {locked && <span className="recipe-lock">Lv.{recipe.requiredLevel}+</span>}
              </div>
              <div className="recipe-ingredients">
                {recipe.ingredients.map((ing, i) => {
                  const have = player.inventory.find(it => it.id === ing.item.id);
                  const enough = have && have.qty >= ing.qty;
                  return (
                    <span key={i} className={`ingredient ${enough ? 'ing-ok' : 'ing-missing'}`}>
                      {ing.item.emoji} ×{ing.qty} {have ? `(${have.qty})` : '(0)'}
                    </span>
                  );
                })}
              </div>
              <button
                className={`pixel-btn ${craftable ? 'pixel-btn-green' : 'pixel-btn-gray'} craft-btn`}
                disabled={!craftable}
                onClick={() => craftItem(recipe.id, recipe)}
              >
                {locked ? '🔒 Создать' : craftable ? '✨ Создать' : '❌ Создать'}
              </button>
            </div>
          );
        })}
      </div>

      <div className="inventory-mini">
        <div className="inv-title">🎒 Инвентарь</div>
        <div className="inv-items">
          {player.inventory.length === 0 ? (
            <span className="empty-hint">Пусто — собери урожай!</span>
          ) : player.inventory.map(item => (
            <div key={item.id} className="inv-item">
              <span>{item.emoji}</span>
              <span className="inv-qty">×{item.qty}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
