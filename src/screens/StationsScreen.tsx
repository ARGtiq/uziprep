import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { STATIONS } from '@/data/stations';
import type { StationCategory } from '@/types/station';
import { Icon } from '@/components/Icon';
import { IconBadge } from '@/components/IconBadge';
import { db } from '@/lib/db';
import { getStreak, getStationXp, levelForXp, getAllXp } from '@/lib/streakAndXp';
import { NextActionCard } from '@/components/NextActionCard';
import { CharacterAvatar } from '@/components/CharacterAvatar';
import { getCharacter, hasCharacter, getShowOnHome, setShowOnHome, levelFromXp, tierFromLevel } from '@/lib/character';

const CATS: Array<StationCategory | 'Все'> = ['Все', 'УЗИ', 'Неотложная помощь', 'Общие навыки'];

interface Props {
  onOpenStation: (id: string) => void;
  onGoExam: () => void;
  onOpenWeakSpots: () => void;
  onOpenMnemonics: () => void;
  onOpenCharacter: () => void;
  onOpenOverview: () => void;
  onOpenUziRitual: () => void;
  onOpenOskeStructure: () => void;
}

export function StationsScreen({ onOpenStation, onGoExam, onOpenWeakSpots, onOpenMnemonics, onOpenCharacter, onOpenOverview, onOpenUziRitual, onOpenOskeStructure }: Props) {
  const streak = getStreak();
  const [showCharacterOnHome, setShowCharacterOnHome] = useState(getShowOnHome);
  const character = hasCharacter() ? getCharacter() : null;
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

  function hideCharacter(e: React.MouseEvent) {
    e.stopPropagation();
    setShowOnHome(false);
    setShowCharacterOnHome(false);
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

      <NextActionCard onOpenWeakSpots={onOpenWeakSpots} onOpenStation={onOpenStation} onGoExam={onGoExam} />

      <div
        role="button"
        tabIndex={0}
        onClick={onOpenCharacter}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpenCharacter()}
        className="relative mb-3 flex w-full cursor-pointer items-center gap-3 rounded-m3-md bg-surface-container-low p-3.5 text-left"
      >
        {character && showCharacterOnHome ? (
          <>
            <div className="shrink-0">
              <CharacterAvatar characterClass={character.class} tier={tierFromLevel(levelFromXp(Object.values(getAllXp()).reduce((a, b) => a + b, 0)).level)} size={44} />
            </div>
            <button
              onClick={hideCharacter}
              aria-label="Скрыть персонажа с главной"
              title="Скрыть с главной"
              className="absolute right-2 top-2 text-on-surface-variant opacity-40 hover:opacity-100"
            >
              <Icon name="close" size={14} />
            </button>
          </>
        ) : (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
            <Icon name="workspace_premium" size={20} />
          </div>
        )}
        <div className="flex-1">
          <b className="text-sm">{levelForXp(Object.values(getAllXp()).reduce((a, b) => a + b, 0)).label}</b>
          <div className="text-xs text-on-surface-variant">
            {Object.values(getAllXp()).reduce((a, b) => a + b, 0)} XP
            {streak.count > 0 && <> · 🔥 {streak.count} {streak.count === 1 ? 'день' : 'дня'} подряд</>}
          </div>
        </div>
        <Icon name="arrow_forward" size={16} className="shrink-0 text-on-surface-variant" />
      </div>

      <button
        onClick={onOpenOverview}
        className="mb-3 flex w-full items-center gap-3 rounded-m3-md bg-secondary-container p-3.5 text-left"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-m3-md bg-primary text-on-primary">
          <Icon name="grid_view" size={20} />
        </span>
        <div className="flex-1">
          <b className="text-sm text-on-secondary-container">Обзор станций</b>
          <div className="text-xs text-on-surface-variant">Общая рамка + пролистай различия — быстрое повторение без тренировки</div>
        </div>
        <Icon name="arrow_forward" size={16} className="shrink-0 text-on-surface-variant" />
      </button>

      <div className="mb-3 flex gap-2">
        <button onClick={onOpenUziRitual} className="flex flex-1 items-center justify-center gap-1 rounded-full border border-outline-variant py-2 text-xs font-semibold text-on-surface-variant">
          УЗИ-ритуал
        </button>
        <button onClick={onOpenOskeStructure} className="flex flex-1 items-center justify-center gap-1 rounded-full border border-outline-variant py-2 text-xs font-semibold text-on-surface-variant">
          Как устроен ОСКЭ
        </button>
      </div>

      <div className="mb-3 flex gap-2">
        <button onClick={onOpenWeakSpots} className="flex flex-1 items-center justify-center gap-1 rounded-full border border-outline-variant py-2 text-xs font-semibold text-on-surface-variant">
          Слабые места
        </button>
        <button onClick={onOpenMnemonics} className="flex flex-1 items-center justify-center gap-1 rounded-full border border-outline-variant py-2 text-xs font-semibold text-on-surface-variant">
          Мои мнемоники
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
              <IconBadge icon={s.icon as any} colorKey={s.id} size="md" />
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
