import type { CharacterClass } from '@/lib/character';

interface Props {
  characterClass: CharacterClass;
  tier: 1 | 2 | 3 | 4 | 5;
  size?: number;
}

/**
 * Оригинальный силуэт-эмблема персонажа (не иллюстрация лица/тела —
 * абстрактный геральдический щит с символом класса), меняется по мере
 * роста уровня: больше слоёв ауры/оправы на высоких tier. Специально
 * избегаем детализированной антропоморфной фигуры — после истории с
 * неудачной анатомической схемой лучше держаться простой, однозначной
 * геометрии без риска двусмысленного прочтения.
 */
const CLASS_SYMBOL: Record<CharacterClass, (color: string) => JSX.Element> = {
  warrior: (color) => <path d="M50 20 L58 45 L50 80 L42 45 Z M35 40 L65 40" stroke={color} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  mage: (color) => (
    <g stroke={color} strokeWidth={6} fill="none" strokeLinecap="round">
      <path d="M50 15 L50 75" />
      <path d="M35 30 L65 30" />
      <circle cx="50" cy="15" r="6" fill={color} stroke="none" />
    </g>
  ),
  ranger: (color) => <path d="M25 65 L75 25 M55 22 L75 25 L72 45" stroke={color} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  healer: (color) => (
    <g stroke={color} strokeWidth={7} strokeLinecap="round">
      <path d="M50 20 L50 65" />
      <path d="M28 42 L72 42" />
    </g>
  ),
};

const TIER_RINGS: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 };

export function CharacterAvatar({ characterClass, tier, size = 96 }: Props) {
  const rings = TIER_RINGS[tier];
  const primaryColor = 'rgb(var(--m3-primary))';
  const symbolColor = 'rgb(var(--m3-on-primary-container))';

  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      {/* геральдический щит-фон */}
      <path d="M50 5 L90 20 L90 55 Q90 85 50 97 Q10 85 10 55 L10 20 Z" fill="rgb(var(--m3-primary-container))" />
      {/* кольца ауры по числу tier — читаемый визуальный индикатор роста без лишней детализации */}
      {Array.from({ length: rings }).map((_, i) => (
        <path
          key={i}
          d="M50 5 L90 20 L90 55 Q90 85 50 97 Q10 85 10 55 L10 20 Z"
          fill="none"
          stroke={primaryColor}
          strokeWidth={2}
          opacity={0.35 + i * 0.15}
          transform={`scale(${1 - (i + 1) * 0.06})`}
          style={{ transformOrigin: '50px 50px' }}
        />
      ))}
      <g transform="translate(0, 2)">{CLASS_SYMBOL[characterClass](symbolColor)}</g>
    </svg>
  );
}
