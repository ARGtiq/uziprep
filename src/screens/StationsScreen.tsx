import { useState } from 'react';
import { STATIONS } from '@/data/stations';
import type { StationCategory } from '@/types/station';

const CATS: Array<StationCategory | 'Все'> = ['Все', 'УЗИ', 'Неотложная помощь', 'Общие навыки'];

interface Props {
  onOpenStation: (id: string) => void;
  onGoExam: () => void;
}

export function StationsScreen({ onOpenStation, onGoExam }: Props) {
  const [filter, setFilter] = useState<(typeof CATS)[number]>('Все');
  const list = STATIONS.filter((s) => filter === 'Все' || s.category === filter);

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
          <span className="msr text-lg" aria-hidden="true">arrow_forward</span>
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
        {list.map((s) => (
          <button
            key={s.id}
            onClick={() => onOpenStation(s.id)}
            className="flex gap-3.5 rounded-m3-md bg-surface-container-low p-3.5 text-left"
          >
            <span className="msr flex h-12 w-12 shrink-0 items-center justify-center rounded-m3-md bg-primary-container text-xl text-on-primary-container" aria-hidden="true">
              {s.icon}
            </span>
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-wide text-primary">{s.category}</div>
              <h3 className="text-base font-semibold">{s.title}</h3>
              <div className="mb-0.5 flex items-center gap-1 text-xs text-on-surface-variant">
                <span className="msr text-sm" aria-hidden="true">schedule</span> {s.timeMinutes} мин
              </div>
              <p className="text-xs leading-snug text-on-surface-variant">{s.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
