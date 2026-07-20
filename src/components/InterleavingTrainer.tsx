import { useMemo, useState } from 'react';
import { STATIONS } from '@/data/stations';
import type { StepBlock } from '@/types/station';
import { SingleBlockOrdering, type SingleBlockResult } from '@/components/SingleBlockOrdering';
import { recordBlockResult } from '@/lib/mastery';
import { addXp } from '@/lib/streakAndXp';
import { Icon } from '@/components/Icon';

interface PoolItem {
  stationId: string;
  stationTitle: string;
  scenarioName: string;
  block: StepBlock;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const SESSION_SIZE = 6;

function buildPool(excludeStationId?: string): PoolItem[] {
  const items: PoolItem[] = [];
  for (const s of STATIONS) {
    if (s.id === excludeStationId) continue; // текущую станцию не мешаем — она и так открыта отдельно
    const scenario = s.scenarios?.[Math.floor(Math.random() * (s.scenarios?.length ?? 1))];
    if (!scenario) continue;
    for (const block of scenario.stepBlocks) {
      if (block.items.length < 3) continue; // слишком короткие блоки неинтересны для тренировки
      items.push({ stationId: s.id, stationTitle: s.title, scenarioName: scenario.name, block });
    }
  }
  return shuffle(items).slice(0, SESSION_SIZE);
}

/**
 * Интерливинг: блоки вперемешку из РАЗНЫХ станций в одной сессии,
 * а не подряд один блок одной станции до усвоения. По исследованиям
 * памяти это хуже ощущается "в моменте" (труднее), но даёт более
 * прочное и переносимое запоминание — ближе к тому, как на реальном
 * экзамене неизвестно заранее, какая станция достанется.
 */
export function InterleavingTrainer({ excludeStationId }: { excludeStationId?: string }) {
  const [sessionKey, setSessionKey] = useState(0);
  const pool = useMemo(() => buildPool(excludeStationId), [excludeStationId, sessionKey]);
  const [index, setIndex] = useState(0);
  const [perfectCount, setPerfectCount] = useState(0);

  if (pool.length === 0) {
    return <p className="text-sm text-on-surface-variant">Недостаточно данных для интерливинг-сессии — открой ещё пару станций.</p>;
  }

  const current = pool[index];
  const done = index >= pool.length;

  function handleChecked(result: SingleBlockResult) {
    recordBlockResult(current.stationId, current.scenarioName, current.block.block, result.mistakes === 0);
    addXp(current.stationId, result.mistakes === 0 ? 5 : 1);
    if (result.mistakes === 0) setPerfectCount((n) => n + 1);
  }

  function next() {
    setIndex((i) => i + 1);
  }

  function restart() {
    setSessionKey((k) => k + 1);
    setIndex(0);
    setPerfectCount(0);
  }

  if (done) {
    return (
      <div className="py-6 text-center">
        <Icon name="workspace_premium" size={40} className="mx-auto text-primary" />
        <h2 className="mt-3 text-lg font-semibold">Сессия завершена</h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          Без ошибок: {perfectCount} из {pool.length} блоков из разных станций
        </p>
        <button onClick={restart} className="mt-4 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary">
          Новая сессия
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-primary">{current.stationTitle}</div>
          <h3 className="text-sm font-semibold">{current.block.block}</h3>
        </div>
        <span className="text-xs text-on-surface-variant">
          {index + 1} / {pool.length}
        </span>
      </div>

      <SingleBlockOrdering block={current.block} resetKey={`${sessionKey}-${index}`} onChecked={handleChecked} onAdvance={next} advanceLabel="Следующий блок (другая станция)" />
    </div>
  );
}
