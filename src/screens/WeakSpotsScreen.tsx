import { useLiveQuery } from 'dexie-react-hooks';
import { listWeakBlocks } from '@/lib/mastery';
import { getStationById } from '@/data/stations';
import { Icon } from '@/components/Icon';

interface Props {
  onOpenStation: (stationId: string) => void;
}

/**
 * Прямая навигация "что подтянуть" вместо того, чтобы гадать самому —
 * агрегирует блоки с самым низким уровнем мастерства (см. lib/mastery.ts)
 * по всем станциям сразу.
 */
export function WeakSpotsScreen({ onOpenStation }: Props) {
  const weak = useLiveQuery(() => listWeakBlocks(15), [], []) ?? [];

  if (weak.length === 0) {
    return (
      <div className="py-10 text-center">
        <Icon name="check_circle" size={40} className="mx-auto text-primary" />
        <p className="mt-3 text-sm text-on-surface-variant">
          Пока нет данных о слабых местах — пройди пару блоков в тренировке порядка, и здесь появится, что стоит подтянуть.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold">Слабые места</h1>
      <p className="mb-4 text-sm text-on-surface-variant">Блоки, которые чаще всего собираются с ошибками — потренируй в первую очередь.</p>
      <div className="flex flex-col gap-2">
        {weak.map((b) => {
          const station = getStationById(b.stationId);
          return (
            <button
              key={b.key}
              onClick={() => onOpenStation(b.stationId)}
              className="flex items-center gap-3 rounded-m3-md bg-surface-container-low p-3 text-left"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-error/15 text-xs font-bold text-error">
                {b.level}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{b.blockName}</div>
                <div className="truncate text-xs text-on-surface-variant">{station?.title ?? b.stationId}</div>
              </div>
              <Icon name="arrow_forward" size={16} className="shrink-0 text-on-surface-variant" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
