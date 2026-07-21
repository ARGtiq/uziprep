import type { CharacterClass } from '@/lib/character';

interface Props {
  characterClass: CharacterClass;
  tier: 1 | 2 | 3 | 4 | 5;
  size?: number;
}

/**
 * Оригинальный силуэт-эмблема персонажа (геральдический щит с символом
 * класса) — намеренно НЕ детализированная антропоморфная фигура. После
 * истории с неудачной анатомической схемой и двусмысленной иконкой
 * держимся простой, однозначной геометрии. "Прокачка" читается через
 * нарастающую сложность оправы, а не через прорисовку тела/лица:
 *
 * tier 1 — голый щит с символом
 * tier 2 — + кольцо ауры, боковые самоцветы
 * tier 3 — + второе кольцо, "крылья"-флероны по бокам щита
 * tier 4 — + лавровый венок снизу
 * tier 5 — золотой щит, три кольца, венок, звезда-навершие сверху
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

const SHIELD_PATH = 'M50 5 L90 20 L90 55 Q90 85 50 97 Q10 85 10 55 L10 20 Z';

function Gem({ x, y, color }: { x: number; y: number; color: string }) {
  return <path d={`M${x} ${y - 5} L${x + 5} ${y} L${x} ${y + 5} L${x - 5} ${y} Z`} fill={color} />;
}

function Wing({ side, color }: { side: 'left' | 'right'; color: string }) {
  const flip = side === 'left' ? -1 : 1;
  return (
    <path
      d={`M${50 + flip * 38} 45 Q${50 + flip * 48} 40 ${50 + flip * 46} 58 Q${50 + flip * 43} 68 ${50 + flip * 36} 62 Z`}
      fill={color}
      opacity={0.85}
    />
  );
}

function LaurelLeaf({ x, y, angle, color }: { x: number; y: number; angle: number; color: string }) {
  return (
    <ellipse cx={x} cy={y} rx="5" ry="2.4" fill={color} transform={`rotate(${angle} ${x} ${y})`} />
  );
}

export function CharacterAvatar({ characterClass, tier, size = 96 }: Props) {
  const primaryColor = tier === 5 ? '#D4A62A' : 'rgb(var(--m3-primary))';
  const shieldFill = tier === 5 ? '#F5E4A8' : 'rgb(var(--m3-primary-container))';
  const symbolColor = tier === 5 ? '#7A5A00' : 'rgb(var(--m3-on-primary-container))';
  const rings = tier >= 4 ? 3 : tier >= 2 ? Math.min(2, tier - 1) : 0;

  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      {tier >= 3 && <Wing side="left" color={primaryColor} />}
      {tier >= 3 && <Wing side="right" color={primaryColor} />}

      <path d={SHIELD_PATH} fill={shieldFill} />

      {Array.from({ length: rings }).map((_, i) => (
        <path
          key={i}
          d={SHIELD_PATH}
          fill="none"
          stroke={primaryColor}
          strokeWidth={2}
          opacity={0.35 + i * 0.2}
          transform={`scale(${1 - (i + 1) * 0.06})`}
          style={{ transformOrigin: '50px 50px' }}
        />
      ))}

      {tier >= 2 && <Gem x={15} y={38} color={primaryColor} />}
      {tier >= 2 && <Gem x={85} y={38} color={primaryColor} />}

      <g transform="translate(0, 2)">{CLASS_SYMBOL[characterClass](symbolColor)}</g>

      {tier >= 4 && (
        <g>
          {[-18, -9, 0].map((dy, i) => (
            <LaurelLeaf key={`l${i}`} x={26 - i * 2} y={92 + dy * 0.15} angle={-30 - i * 10} color={primaryColor} />
          ))}
          {[-18, -9, 0].map((dy, i) => (
            <LaurelLeaf key={`r${i}`} x={74 + i * 2} y={92 + dy * 0.15} angle={30 + i * 10} color={primaryColor} />
          ))}
        </g>
      )}
    </svg>
  );
}
