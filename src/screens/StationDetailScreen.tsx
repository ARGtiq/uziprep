import { useEffect, useState } from 'react';
import { getStationById } from '@/data/stations';
import { getProgress, saveProgress } from '@/lib/db';
import { StepOrderingGame } from '@/components/StepOrderingGame';
import { Icon } from '@/components/Icon';

type Tab = 'algo' | 'check' | 'order';

interface Props {
  stationId: string;
  onBack: () => void;
}

export function StationDetailScreen({ stationId, onBack }: Props) {
  const station = getStationById(stationId);
  const [tab, setTab] = useState<Tab>('algo');
  const [checklistDone, setChecklistDone] = useState<Record<string, boolean>>({});

  useEffect(() => {
    getProgress(stationId).then((p) => setChecklistDone(p.checklistDone));
  }, [stationId]);

  if (!station) return null;

  function toggle(key: string) {
    setChecklistDone((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      saveProgress({ stationId, checklistDone: next, lastPracticedAt: Date.now() });
      return next;
    });
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-2.5">
        <button
          onClick={onBack}
          aria-label="Назад"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container"
        >
          <Icon name="arrow_back" size={18} />
        </button>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-primary">{station.category}</div>
          <h1 className="text-xl font-semibold">{station.title}</h1>
        </div>
      </div>

      <div className="mb-4 flex gap-4 border-b border-outline-variant">
        {([
          ['algo', 'Алгоритм'],
          ['check', 'Чек-лист'],
          ['order', 'Тренировка порядка'],
        ] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={[
              'border-b-2 pb-2.5 text-sm font-medium',
              tab === key ? 'border-primary text-primary font-semibold' : 'border-transparent text-on-surface-variant',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'algo' &&
        station.steps.map((step, i) => (
          <div key={i} className="flex gap-3 border-b border-outline-variant py-3.5 last:border-none">
            <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-secondary-container text-xs font-semibold text-on-secondary-container">
              {i + 1}
            </div>
            <p className="text-sm leading-relaxed">{step}</p>
          </div>
        ))}

      {tab === 'check' &&
        station.checklist.map((block) => (
          <div key={block.block}>
            <h2 className="mt-4 mb-2 text-sm font-semibold text-on-surface-variant">{block.block}</h2>
            {block.items.map((item) => {
              const key = `${block.block}::${item}`;
              return (
                <label key={key} className="flex items-start gap-2.5 border-b border-outline-variant py-3 last:border-none">
                  <input
                    type="checkbox"
                    checked={!!checklistDone[key]}
                    onChange={() => toggle(key)}
                    className="mt-0.5 h-5 w-5 shrink-0 accent-[rgb(var(--m3-primary))]"
                  />
                  <span className="text-sm leading-snug">{item}</span>
                </label>
              );
            })}
          </div>
        ))}

      {tab === 'order' && (
        <StepOrderingGame
          station={station}
          onFinish={(score) => saveProgress({ stationId, checklistDone, orderingBestScore: score, lastPracticedAt: Date.now() })}
        />
      )}
    </div>
  );
}
