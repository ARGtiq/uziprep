import { useState } from 'react';
import { STATIONS } from '@/data/stations';
import { StationOverviewCarousel } from '@/components/StationOverviewCarousel';
import { IconBadge } from '@/components/IconBadge';
import { Icon } from '@/components/Icon';

interface Props {
  onBack: () => void;
  onOpenCheatSheet: () => void;
}

/** Выбор станции → сразу карусель, без промежуточных экранов выбора режима. */
export function StationOverviewScreen({ onBack, onOpenCheatSheet }: Props) {
  const [stationId, setStationId] = useState<string | null>(null);
  const station = stationId ? STATIONS.find((s) => s.id === stationId) : null;

  if (!station) {
    return (
      <div>
        <button className="mb-4 flex items-center gap-1 text-sm text-on-surface-variant" onClick={onBack}>
          <Icon name="arrow_back" size={16} /> Назад
        </button>
        <h1 className="mb-1 text-xl font-semibold">Обзор станций</h1>
        <p className="mb-4 text-sm text-on-surface-variant">Общая рамка + пролистываемые различия, для беглого повторения без тренировки.</p>
        <button onClick={onOpenCheatSheet} className="mb-4 flex items-center gap-1.5 text-xs font-semibold text-primary">
          <Icon name="workspace_premium" size={14} />
          Шпаргалка для печати →
        </button>
        <div className="flex flex-col gap-2">
          {STATIONS.map((s) => (
            <button key={s.id} onClick={() => setStationId(s.id)} className="flex items-center gap-3 rounded-m3-md bg-surface-container-low p-3 text-left">
              <IconBadge icon={s.icon as any} colorKey={s.id} />
              <div>
                <div className="text-sm font-semibold">{s.title}</div>
                <div className="text-xs text-on-surface-variant">{s.category}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <button className="mb-4 flex items-center gap-1 text-sm text-on-surface-variant" onClick={() => setStationId(null)}>
        <Icon name="arrow_back" size={16} /> Другая станция
      </button>
      <h1 className="mb-4 text-xl font-semibold">{station.title}</h1>
      <StationOverviewCarousel scenarios={station.scenarios ?? [{ name: 'default', steps: station.steps, stepBlocks: [], checklist: station.checklist }]} />
    </div>
  );
}
