import { GameScreen } from '@/game/types';

interface NavBarProps {
  current: GameScreen;
  onNavigate: (screen: GameScreen) => void;
}

const TABS: { id: GameScreen; emoji: string; label: string }[] = [
  { id: 'farm', emoji: '🌾', label: 'Ферма' },
  { id: 'battle', emoji: '⚔️', label: 'Бой' },
  { id: 'shop', emoji: '🏪', label: 'Лавка' },
  { id: 'craft', emoji: '⚗️', label: 'Крафт' },
  { id: 'home', emoji: '🏡', label: 'Дом' },
];

export default function NavBar({ current, onNavigate }: NavBarProps) {
  return (
    <nav className="pixel-navbar">
      {TABS.map(tab => (
        <button
          key={tab.id}
          className={`nav-tab ${current === tab.id ? 'nav-tab-active' : ''}`}
          onClick={() => onNavigate(tab.id)}
        >
          <span className="nav-emoji">{tab.emoji}</span>
          <span className="nav-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
