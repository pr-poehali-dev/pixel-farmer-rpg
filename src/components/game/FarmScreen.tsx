import { FarmCell } from '@/game/types';
import { CROPS } from '@/game/data';

interface FarmScreenProps {
  farm: FarmCell[];
  selectedCropId: string;
  setSelectedCropId: (id: string) => void;
  plantCrop: (cellId: number) => void;
  waterCrop: (cellId: number) => void;
  harvestCrop: (cellId: number) => void;
  getCropStage: (cell: FarmCell) => number;
}

const STAGE_EMOJI: Record<number, string> = {
  0: '',
  1: '🌱',
  2: '🌿',
  3: '✨',
};

export default function FarmScreen({ farm, selectedCropId, setSelectedCropId, plantCrop, waterCrop, harvestCrop, getCropStage }: FarmScreenProps) {
  const handleCellClick = (cell: FarmCell) => {
    if (!cell.unlocked) return;
    if (!cell.crop) {
      plantCrop(cell.id);
    } else {
      const stage = getCropStage(cell);
      if (stage >= 3) {
        harvestCrop(cell.id);
      } else {
        waterCrop(cell.id);
      }
    }
  };

  return (
    <div className="screen-container">
      <div className="screen-title">🌾 Моя Ферма</div>

      <div className="crop-selector">
        <div className="selector-label">Выбери культуру:</div>
        <div className="crop-buttons">
          {CROPS.map(crop => (
            <button
              key={crop.id}
              className={`crop-btn ${selectedCropId === crop.id ? 'crop-btn-active' : ''}`}
              onClick={() => setSelectedCropId(crop.id)}
            >
              <span className="crop-emoji">{crop.emoji}</span>
              <span className="crop-name">{crop.name}</span>
              <span className="crop-time">{crop.growTime}с</span>
            </button>
          ))}
        </div>
      </div>

      <div className="farm-grid">
        {farm.map(cell => {
          const stage = getCropStage(cell);
          const isReady = cell.crop && stage >= 3;
          return (
            <button
              key={cell.id}
              className={`farm-cell ${!cell.unlocked ? 'farm-cell-locked' : ''} ${cell.watered ? 'farm-cell-watered' : ''} ${isReady ? 'farm-cell-ready' : ''}`}
              onClick={() => handleCellClick(cell)}
            >
              {!cell.unlocked ? (
                <span className="cell-lock">🔒</span>
              ) : cell.crop ? (
                <div className="cell-crop">
                  <div className="cell-stage">{STAGE_EMOJI[stage]}</div>
                  <div className="cell-crop-emoji">{cell.crop.emoji}</div>
                  {cell.watered && <div className="cell-water">💧</div>}
                  {isReady && <div className="cell-ready-glow" />}
                </div>
              ) : (
                <span className="cell-empty">+</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="farm-hint">
        <span>Нажми на клетку — посади / полей / собери урожай</span>
      </div>
    </div>
  );
}
