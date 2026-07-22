import { useState } from 'react';
import { STATIONS } from '@/data/stations';
import { compareSteps } from '@/lib/scenarioComparison';
import { boldFirstWord } from '@/lib/textDisplay';
import { IconBadge } from '@/components/IconBadge';
import { Icon } from '@/components/Icon';

interface Props {
  onBack: () => void;
}

/**
 * Одностраничная шпаргалка для печати — общее ядро + отличия
 * конкретного сценария помещаются на один лист именно потому, что
 * общая рамка у станций реально одинаковая (см. вкладку "Сравнение").
 * "Печать" — через нативный window.print() с print-стилями Tailwind
 * (print:hidden на элементах интерфейса), без сторонних PDF-библиотек
 * — большинство браузеров/ОС дают "Сохранить как PDF" прямо в диалоге
 * печати.
 */
export function CheatSheetScreen({ onBack }: Props) {
  const [stationId, setStationId] = useState<string | null>(null);
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const station = stationId ? STATIONS.find((s) => s.id === stationId) : null;

  if (!station) {
    return (
      <div>
        <button className="mb-4 flex items-center gap-1 text-sm text-on-surface-variant print:hidden" onClick={onBack}>
          <Icon name="arrow_back" size={16} /> Назад
        </button>
        <h1 className="mb-1 text-xl font-semibold">Шпаргалка для печати</h1>
        <p className="mb-4 text-sm text-on-surface-variant">Одна станция — один лист: общее ядро + отличия выбранного сценария.</p>
        <div className="flex flex-col gap-2">
          {STATIONS.map((s) => (
            <button key={s.id} onClick={() => setStationId(s.id)} className="flex items-center gap-3 rounded-m3-md bg-surface-container-low p-3 text-left">
              <IconBadge icon={s.icon as any} colorKey={s.id} />
              <div className="text-sm font-semibold">{s.title}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const scenarios = station.scenarios ?? [{ name: 'default', steps: station.steps, stepBlocks: [], checklist: station.checklist }];
  const scenario = scenarios[scenarioIndex] ?? scenarios[0];
  const { common, perScenario } = compareSteps(scenarios);
  const unique = scenarios.length > 1 ? perScenario[scenarioIndex]?.unique ?? [] : scenario.stepBlocks.flatMap((b) => b.items);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between print:hidden">
        <button className="flex items-center gap-1 text-sm text-on-surface-variant" onClick={() => setStationId(null)}>
          <Icon name="arrow_back" size={16} /> Другая станция
        </button>
        <button onClick={() => window.print()} className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary">
          Печать / Сохранить PDF
        </button>
      </div>

      {scenarios.length > 1 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 print:hidden">
          {scenarios.map((sc, i) => (
            <button
              key={sc.name}
              onClick={() => setScenarioIndex(i)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs whitespace-nowrap ${
                scenarioIndex === i ? 'border-transparent bg-primary-container font-semibold text-on-primary-container' : 'border-outline-variant text-on-surface-variant'
              }`}
            >
              {sc.name}
            </button>
          ))}
        </div>
      )}

      <div className="rounded-m3-md border border-outline-variant p-4 text-sm print:border-none print:p-0 print:text-black">
        <h1 className="mb-0.5 text-lg font-bold">{station.title}</h1>
        {scenarios.length > 1 && <p className="mb-3 text-xs text-on-surface-variant print:text-black">{scenario.name}</p>}

        {common.length > 0 && (
          <>
            <h2 className="mb-1 mt-2 text-xs font-bold uppercase tracking-wide text-on-surface-variant print:text-black">Общее ядро</h2>
            <ol className="mb-3 list-decimal pl-5">
              {common.map((step) => (
                <li key={step.num} className="mb-0.5 leading-snug">
                  {boldFirstWord(step.text)}
                </li>
              ))}
            </ol>
          </>
        )}

        <h2 className="mb-1 mt-2 text-xs font-bold uppercase tracking-wide text-on-surface-variant print:text-black">
          {scenarios.length > 1 ? `Отличия: ${scenario.name}` : 'Алгоритм'}
        </h2>
        <ol className="list-decimal pl-5">
          {unique.map((step) => (
            <li key={step.num} className="mb-0.5 leading-snug">
              {boldFirstWord(step.text)}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
