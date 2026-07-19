import { useState } from 'react';
import type { StationScenario } from '@/types/station';
import { compareSteps } from '@/lib/scenarioComparison';
import { BlockAccordionTrainer } from '@/components/BlockAccordionTrainer';

interface Props {
  stationId: string;
  scenarios: StationScenario[];
}

/**
 * Двухшаговая тренировка для станций с несколькими сценариями:
 * сначала общее ядро (одинаковое для всех сценариев — обычно
 * "Начало"/"Завершение"), потом — специфика конкретного сценария.
 * Технически переиспользует BlockAccordionTrainer, просто с другим
 * набором "блоков": на первом шаге это единственный псевдо-блок
 * "Общее ядро", на втором — уникальные блоки выбранного сценария.
 */
export function CoreThenDiffTrainer({ stationId, scenarios }: Props) {
  const [phase, setPhase] = useState<'core' | 'pick' | 'diff'>('core');
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const { common, perScenario } = compareSteps(scenarios);

  if (phase === 'core') {
    return (
      <div>
        <p className="mb-3 text-xs text-on-surface-variant">
          Шаг 1 из 2: общее ядро — то, что одинаково для всех сценариев станции ({common.length} пунктов).
        </p>
        <BlockAccordionTrainer
          stationId={stationId}
          scenarioName="__core__"
          blocks={[{ block: 'Общее ядро', items: common }]}
        />
        <button onClick={() => setPhase('pick')} className="mt-4 w-full rounded-full border border-outline-variant py-2.5 text-sm font-semibold">
          Дальше: специфика сценария →
        </button>
      </div>
    );
  }

  if (phase === 'pick') {
    return (
      <div>
        <p className="mb-3 text-xs text-on-surface-variant">Шаг 2 из 2: выбери сценарий, чтобы потренировать его отличия.</p>
        <div className="flex flex-col gap-2">
          {perScenario.map((sc, i) => (
            <button
              key={sc.name}
              onClick={() => {
                setScenarioIndex(i);
                setPhase('diff');
              }}
              className="rounded-m3-md bg-surface-container-low p-3 text-left text-sm"
            >
              <b>{sc.name}</b>
              <div className="text-xs text-on-surface-variant">{sc.unique.length} уникальных пунктов</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const sc = perScenario[scenarioIndex];
  return (
    <div>
      <p className="mb-3 text-xs text-on-surface-variant">
        Отличия сценария «{sc.name}» от общего ядра ({sc.unique.length} пунктов).
      </p>
      <BlockAccordionTrainer stationId={stationId} scenarioName={sc.name} blocks={[{ block: sc.name, items: sc.unique }]} />
      <button onClick={() => setPhase('pick')} className="mt-4 w-full rounded-full border border-outline-variant py-2.5 text-sm font-semibold">
        ← Другой сценарий
      </button>
    </div>
  );
}
