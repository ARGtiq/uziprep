import { useState } from 'react';
import { StationOverviewScreen } from '@/screens/StationOverviewScreen';
import { ActionPatternScreen } from '@/screens/ActionPatternScreen';
import { UziRitualScreen } from '@/screens/UziRitualScreen';
import { OskeStructureScreen } from '@/screens/OskeStructureScreen';
import { MnemonicsScreen } from '@/screens/MnemonicsScreen';
import { CheatSheetScreen } from '@/screens/CheatSheetScreen';

export type ReferenceSubTab = 'overview' | 'action-pattern' | 'uzi-ritual' | 'oske-structure' | 'mnemonics' | 'cheatsheet';

const PILLS: [ReferenceSubTab, string][] = [
  ['overview', 'Обзор станций'],
  ['action-pattern', 'Цветовая карта'],
  ['uzi-ritual', 'УЗИ-ритуал'],
  ['oske-structure', 'Как устроен ОСКЭ'],
  ['mnemonics', 'Мои мнемоники'],
];

interface Props {
  onBack: () => void;
  onOpenStation: (stationId: string) => void;
  initialSubTab?: ReferenceSubTab;
}

/**
 * Раньше это были 5 отдельных кнопок на главном экране и 5 разных
 * "мест", куда идти за справочным материалом (не тренировкой) — по
 * смыслу всё это одно и то же: посмотреть, а не проверить себя.
 * Сведено в один хаб с переключателем-пилюлями; каждый экран внутри
 * не переписан — просто onBack теперь ведёт из хаба целиком, а не
 * на несуществующий "предыдущий экран" (то же самое поведение, что
 * было раньше, просто одна точка входа вместо пяти).
 */
export function ReferenceScreen({ onBack, onOpenStation, initialSubTab }: Props) {
  const [sub, setSub] = useState<ReferenceSubTab>(initialSubTab ?? 'overview');
  const [showCheatSheet, setShowCheatSheet] = useState(false);

  if (showCheatSheet) {
    return <CheatSheetScreen onBack={() => setShowCheatSheet(false)} />;
  }

  return (
    <div>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {PILLS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSub(key)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs whitespace-nowrap ${
              sub === key ? 'border-transparent bg-primary-container font-semibold text-on-primary-container' : 'border-outline-variant text-on-surface-variant'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {sub === 'overview' && <StationOverviewScreen onBack={onBack} onOpenCheatSheet={() => setShowCheatSheet(true)} />}
      {sub === 'action-pattern' && <ActionPatternScreen onBack={onBack} />}
      {sub === 'uzi-ritual' && <UziRitualScreen onBack={onBack} onOpenStation={onOpenStation} onOpenActionPattern={() => setSub('action-pattern')} />}
      {sub === 'oske-structure' && <OskeStructureScreen onBack={onBack} />}
      {sub === 'mnemonics' && <MnemonicsScreen onBack={onBack} onOpenStation={onOpenStation} />}
    </div>
  );
}
