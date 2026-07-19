import { useState } from 'react';
import type { StationScenario } from '@/types/station';
import { compareSteps, compareChecklist } from '@/lib/scenarioComparison';
import { Icon } from '@/components/Icon';

type Mode = 'algo' | 'check';

interface Props {
  scenarios: StationScenario[];
}

export function ScenarioComparisonView({ scenarios }: Props) {
  const [mode, setMode] = useState<Mode>('algo');
  const stepsCmp = compareSteps(scenarios);
  const checklistCmp = compareChecklist(scenarios);

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setMode('algo')}
          className={`flex-1 rounded-full py-2 text-sm font-semibold ${
            mode === 'algo' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'
          }`}
        >
          Алгоритм
        </button>
        <button
          onClick={() => setMode('check')}
          className={`flex-1 rounded-full py-2 text-sm font-semibold ${
            mode === 'check' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'
          }`}
        >
          Чек-лист
        </button>
      </div>

      <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-on-surface-variant">
        <Icon name="check_circle" size={16} className="text-primary" />
        Общее для всех сценариев
      </h2>

      {mode === 'algo' ? (
        stepsCmp.common.length === 0 ? (
          <p className="mb-5 text-sm text-on-surface-variant">Общих шагов между сценариями нет.</p>
        ) : (
          <div className="mb-5 flex flex-col gap-0.5">
            {stepsCmp.common.map((step, i) => (
              <div key={i} className="flex gap-2.5 border-b border-outline-variant py-2.5 last:border-none">
                <span className="text-xs text-on-surface-variant">{i + 1}.</span>
                <p className="text-sm leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        )
      ) : checklistCmp.common.length === 0 ? (
        <p className="mb-5 text-sm text-on-surface-variant">Общих пунктов между сценариями нет.</p>
      ) : (
        <div className="mb-5">
          {checklistCmp.common.map((block) => (
            <div key={block.block} className="mb-3">
              <h3 className="mb-1 text-xs font-medium text-on-surface-variant">{block.block}</h3>
              {block.items.map((item, i) => (
                <div key={i} className="flex gap-2.5 border-b border-outline-variant py-2.5 last:border-none">
                  <Icon name="check_circle" size={14} className="mt-0.5 shrink-0 text-primary" />
                  <p className="text-sm leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-on-surface-variant">
        <Icon name="cancel" size={16} className="text-error" />
        Отличается по сценариям
      </h2>

      {mode === 'algo' ? (
        <div className="flex flex-col gap-2">
          {stepsCmp.perScenario.map((sc) => (
            <details key={sc.name} className="rounded-m3-md bg-surface-container-low open:pb-2">
              <summary className="cursor-pointer list-none px-3.5 py-3 text-sm font-medium">
                <span className="mr-1.5 inline-block [details[open]_&]:rotate-90">›</span>
                {sc.name}
                {sc.unique.length === 0 && <span className="ml-2 text-xs font-normal text-on-surface-variant">(отличий нет)</span>}
              </summary>
              <div className="px-3.5">
                {sc.unique.map((step, i) => (
                  <div key={i} className="flex gap-2.5 border-t border-outline-variant py-2.5 first:border-none">
                    <span className="text-xs text-on-surface-variant">{i + 1}.</span>
                    <p className="text-sm leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {checklistCmp.perScenario.map((sc) => (
            <details key={sc.name} className="rounded-m3-md bg-surface-container-low open:pb-2">
              <summary className="cursor-pointer list-none px-3.5 py-3 text-sm font-medium">
                <span className="mr-1.5 inline-block [details[open]_&]:rotate-90">›</span>
                {sc.name}
                {sc.blocks.length === 0 && <span className="ml-2 text-xs font-normal text-on-surface-variant">(отличий нет)</span>}
              </summary>
              <div className="px-3.5">
                {sc.blocks.map((block) => (
                  <div key={block.block} className="py-2 first:pt-0">
                    <h3 className="mb-1 text-xs font-medium text-on-surface-variant">{block.block}</h3>
                    {block.items.map((item, i) => (
                      <div key={i} className="flex gap-2.5 border-t border-outline-variant py-2 first:border-none">
                        <p className="text-sm leading-relaxed">{item}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
