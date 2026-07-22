import { STATIONS } from '@/data/stations';
import { UZI_RITUAL_STATIONS, UZI_RITUAL_OPENING, UZI_RITUAL_CLOSING } from '@/data/uziRitual';
import { Icon } from '@/components/Icon';

interface Props {
  onBack: () => void;
  onOpenStation: (stationId: string) => void;
  onOpenActionPattern: () => void;
}

/**
 * 10 пунктов, дословно одинаковых во всех трёх УЗИ-станциях —
 * учебный материал, экономит время каждый день (выучил один раз,
 * закрыл вопрос сразу для трёх станций).
 */
export function UziRitualScreen({ onBack, onOpenStation, onOpenActionPattern }: Props) {
  const stations = STATIONS.filter((s) => UZI_RITUAL_STATIONS.includes(s.id));

  return (
    <div>
      <div className="mb-4 flex items-center gap-2.5">
        <button onClick={onBack} aria-label="Назад" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container">
          <Icon name="arrow_back" size={18} />
        </button>
        <h1 className="text-xl font-semibold">УЗИ-ритуал</h1>
      </div>

      <p className="mb-3 text-sm text-on-surface-variant">
        Эти 10 пунктов дословно одинаковы во всех трёх УЗИ-станциях — выучи один раз, а не переучивай на каждой.
      </p>

      <button onClick={onOpenActionPattern} className="mb-4 flex items-center gap-1.5 text-xs font-semibold text-primary">
        <Icon name="grid_view" size={14} />
        Цветовая карта действий рабочей части →
      </button>

      <div className="mb-4 flex flex-wrap gap-2">
        {stations.map((s) => (
          <button key={s.id} onClick={() => onOpenStation(s.id)} className="rounded-full bg-primary-container px-3 py-1.5 text-xs font-semibold text-on-primary-container">
            {s.title}
          </button>
        ))}
      </div>

      <h2 className="mb-2 text-sm font-semibold text-on-surface-variant">Открытие (7)</h2>
      <div className="mb-4 rounded-m3-md bg-surface-container-low p-3.5">
        {UZI_RITUAL_OPENING.map((text, i) => (
          <div key={i} className="flex gap-2.5 border-b border-outline-variant py-2.5 last:border-none">
            <span className="w-5 shrink-0 text-xs text-on-surface-variant">{i + 1}</span>
            <p className="text-sm leading-relaxed">{text}</p>
          </div>
        ))}
      </div>

      <h2 className="mb-2 text-sm font-semibold text-on-surface-variant">Закрытие (3)</h2>
      <div className="rounded-m3-md bg-surface-container-low p-3.5">
        {UZI_RITUAL_CLOSING.map((text, i) => (
          <div key={i} className="flex gap-2.5 border-b border-outline-variant py-2.5 last:border-none">
            <span className="w-5 shrink-0 text-xs text-on-surface-variant">{i + 1}</span>
            <p className="text-sm leading-relaxed">{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
