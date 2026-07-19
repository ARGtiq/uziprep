import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { STATIONS } from '@/data/stations';
import type { StationCategory } from '@/types/station';
import { Icon } from '@/components/Icon';
import { db } from '@/lib/db';
import { getStreak, getStationXp, levelForXp, getAllXp } from '@/lib/streakAndXp';
import { TodayReviewWidget } from '@/components/TodayReviewWidget';

const CATS: Array<StationCategory | 'Все'> = ['Все', 'УЗИ', 'Неотложная помощь', 'Общие навыки'];

interface Props {
  onOpenStation: (id: string) => void;
  onGoExam: () => void;
  onOpenWeakSpots: () => void;
}

export function StationsScreen({ onOpenStation, onGoExam, onOpenWeakSpots }: Props) {
  const streak = getStreak();
  const [filter, setFilter] = useState<(typeof CATS)[number]>('Все');
  const list = STATIONS.filter((s) => filter === 'Все' || s.category === filter);
  const allProgress = useLiveQuery(() => db.progress.toArray(), []) ?? [];

  function checklistRatio(stationId: string): number | null {
    const station = STATIONS.find((s) => s.id === stationId);
    const prog = allProgress.find((p) => p.stationId === stationId);
    if (!station || !prog) return null;
    const doneCount = Object.values(prog.checklistDone).filter(Boolean).length;
    if (doneCount === 0) return null;

    // Для станций с несколькими сценариями прогресс мог копиться в
    // любом из них (ключи чек-листа теперь содержат имя сценария) —
    // берём в знаменатель тот сценарий, где реально есть отмеченные
    // пункты, а не всегда первый по умолчанию.
    const scenarios = station.scenarios?.length
      ? station.scenarios
      : [{ name: 'default', steps: station.steps, stepBlocks: [], checklist: station.checklist }];
    let bestRatio = 0;
    for (const sc of scenarios) {
      const total = sc.checklist.reduce((sum, b) => sum + b.items.length, 0);
      if (total === 0) continue;
      const doneInScenario = sc.checklist.reduce(
        (sum, b) => sum + b.items.filter((item) => prog.checklistDone[`${sc.name}::${b.block}::${item}`]).length,
        0,
      );
      bestRatio = Math.max(bestRatio, doneInScenario / total);
    }
    return bestRatio;
  }

  return (
    <div>
      <div className="relative mb-4 flex h-44 flex-col justify-end overflow-hidden rounded-m3-lg bg-primary p-5 text-on-primary">
        <div className="text-xs uppercase tracking-wide opacity-80">UziPrep</div>
        <h1 className="mt-1 text-2xl font-semibold">Аккредитация по УЗИ</h1>
        <p className="mb-3 text-sm opacity-90">Станции, чек-листы и симуляция экзамена</p>
        <button
          onClick={onGoExam}
          className="inline-flex w-fit items-center gap-1.5 rounded-full bg-on-primary px-4 py-2.5 text-sm font-semibold text-primary"
        >
          Начать пробный экзамен
          <Icon name="arrow_forward" size={18} />
        </button>
      </div>

      <TodayReviewWidget onOpen={onOpenWeakSpots} />

      <div className="mb-3 flex items-center gap-3 rounded-m3-md bg-surface-container-low p-3.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
          <Icon name="workspace_premium" size={20} />
        </div>
        <div className="flex-1">
          <b className="text-sm">{levelForXp(Object.values(getAllXp()).reduce((a, b) => a + b, 0)).label}</b>
          <div className="text-xs text-on-surface-variant">
            {Object.values(getAllXp()).reduce((a, b) => a + b, 0)} XP
            {streak.count > 0 && <> · 🔥 {streak.count} {streak.count === 1 ? 'день' : 'дня'} подряд</>}
          </div>
        </div>
        <button onClick={onOpenWeakSpots} className="flex shrink-0 items-center gap-1 text-xs font-semibold text-on-surface-variant">
          Слабые места <Icon name="arrow_forward" size={14} />
        </button>
      </div>

      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {CATS.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={[
              'shrink-0 rounded-full border px-4 py-2 text-sm whitespace-nowrap',
              filter === c
                ? 'border-transparent bg-primary-container font-semibold text-on-primary-container'
                : 'border-outline-variant text-on-surface-variant',
            ].join(' ')}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2.5">
        {list.map((s) => {
          const ratio = checklistRatio(s.id);
          return (
            <button
              key={s.id}
              onClick={() => onOpenStation(s.id)}
              className="flex gap-3.5 rounded-m3-md bg-surface-container-low p-3.5 text-left"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-m3-md bg-primary-container text-on-primary-container">
                <Icon name={s.icon as any} size={24} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-primary">{s.category}</div>
                  {ratio !== null && (
                    <div className="flex shrink-0 items-center gap-1 text-xs text-on-surface-variant">
                      {ratio === 1 && <Icon name="check_circle" size={14} className="text-primary" />}
                      {Math.round(ratio * 100)}%
                    </div>
                  )}
                </div>
                <h3 className="text-base font-semibold">{s.title}</h3>
                {(() => {
                  const xp = getStationXp(s.id);
                  if (xp === 0) return null;
                  const { label } = levelForXp(xp);
                  return <div className="mb-0.5 text-xs font-medium text-primary">{label} · {xp} XP</div>;
                })()}
                <div className="mb-0.5 flex items-center gap-1 text-xs text-on-surface-variant">
                  <Icon name="schedule" size={14} /> {s.timeMinutes} мин
                </div>
                <p className="text-xs leading-snug text-on-surface-variant">{s.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
