import { useState } from 'react';
import { STATIONS } from '@/data/stations';
import type { Station, StationScenario } from '@/types/station';
import { ZeroMistakeChallenge } from '@/components/ZeroMistakeChallenge';
import { CoreThenDiffTrainer } from '@/components/CoreThenDiffTrainer';
import { FindTheErrorTrainer } from '@/components/FindTheErrorTrainer';
import { OcclusionTrainer } from '@/components/OcclusionTrainer';
import { VoiceRecallTrainer } from '@/components/VoiceRecallTrainer';
import { BlockAccordionTrainer } from '@/components/BlockAccordionTrainer';
import { StepOrderingGame } from '@/components/StepOrderingGame';
import { saveProgress } from '@/lib/db';
import { Icon } from '@/components/Icon';
import { IconBadge } from '@/components/IconBadge';

export type TrainingKind = 'blocks' | 'challenge' | 'core-diff' | 'find-error' | 'occlusion' | 'voice' | 'full';

const KIND_META: Record<TrainingKind, { label: string; icon: string; requiresMultiScenario?: boolean }> = {
  blocks: { label: 'По блокам', icon: 'grid_view' },
  challenge: { label: 'Без права на ошибку', icon: 'emergency' },
  'core-diff': { label: 'Ядро → отличия', icon: 'compare', requiresMultiScenario: true },
  'find-error': { label: 'Найди ошибку', icon: 'cancel' },
  occlusion: { label: 'Скрой и вспомни', icon: 'auto_awesome' },
  voice: { label: 'Расскажи вслух', icon: 'forum' },
  full: { label: 'Всё целиком', icon: 'drag_indicator' },
};

function pickScenario(station: Station): StationScenario | undefined {
  const scenarios = station.scenarios;
  if (!scenarios || scenarios.length === 0) return undefined;
  return scenarios[Math.floor(Math.random() * scenarios.length)];
}

interface Props {
  kind: TrainingKind;
  onExit: () => void;
}

/**
 * Общий флоу "выбери станцию (или случайную) → пройди режим" для пяти
 * тренировочных режимов, вызываемых из раздела Экзамена — раньше эти
 * режимы были доступны только изнутри конкретной станции.
 */
export function TrainingModeScreen({ kind, onExit }: Props) {
  const meta = KIND_META[kind];
  const eligibleStations = STATIONS.filter((s) => (meta.requiresMultiScenario ? (s.scenarios?.length ?? 0) > 1 : (s.scenarios?.length ?? 0) > 0));
  const [stationId, setStationId] = useState<string | null>(null);
  const [scenario, setScenario] = useState<StationScenario | null>(null);

  function pick(station: Station) {
    setStationId(station.id);
    setScenario(pickScenario(station) ?? null);
  }

  function pickRandom() {
    if (eligibleStations.length === 0) return;
    const station = eligibleStations[Math.floor(Math.random() * eligibleStations.length)];
    pick(station);
  }

  if (!stationId || !scenario) {
    return (
      <div>
        <button className="mb-4 flex items-center gap-1 text-sm text-on-surface-variant" onClick={onExit}>
          <Icon name="arrow_back" size={16} /> Назад
        </button>
        <h1 className="mb-1 text-xl font-semibold">{meta.label}</h1>
        <p className="mb-4 text-sm text-on-surface-variant">Выбери станцию или начни со случайной.</p>

        <button onClick={pickRandom} className="mb-4 flex w-full items-center gap-3 rounded-m3-md bg-primary-container p-3.5 text-left">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-m3-md bg-primary text-on-primary">
            <Icon name="auto_awesome" size={22} />
          </span>
          <b className="text-sm text-on-primary-container">Случайная станция</b>
        </button>

        <div className="flex flex-col gap-2">
          {eligibleStations.map((s) => (
            <button key={s.id} onClick={() => pick(s)} className="flex items-center gap-3 rounded-m3-md bg-surface-container-low p-3 text-left">
              <IconBadge icon={s.icon as any} colorKey={s.id} />
              <div>
                <div className="text-sm font-semibold">{s.title}</div>
                <div className="text-xs text-on-surface-variant">{s.category}</div>
              </div>
            </button>
          ))}
        </div>
        {eligibleStations.length === 0 && <p className="text-sm text-on-surface-variant">Нет подходящих станций для этого режима.</p>}
      </div>
    );
  }

  const station = STATIONS.find((s) => s.id === stationId)!;
  const flatSteps = scenario.stepBlocks.flatMap((b) => b.items);

  return (
    <div>
      <button className="mb-4 flex items-center gap-1 text-sm text-on-surface-variant" onClick={() => { setStationId(null); setScenario(null); }}>
        <Icon name="arrow_back" size={16} /> Другая станция
      </button>
      <h1 className="mb-1 text-xl font-semibold">{station.title}</h1>
      <p className="mb-4 text-xs text-on-surface-variant">{scenario.name !== 'default' ? scenario.name : null}</p>

      {kind === 'blocks' && <BlockAccordionTrainer key={scenario.name} stationId={station.id} scenarioName={scenario.name} blocks={scenario.stepBlocks} />}
      {kind === 'challenge' && <ZeroMistakeChallenge stationId={station.id} scenarioName={scenario.name} blocks={scenario.stepBlocks} />}
      {kind === 'core-diff' && station.scenarios && <CoreThenDiffTrainer stationId={station.id} scenarios={station.scenarios} />}
      {kind === 'find-error' && flatSteps.length > 0 && <FindTheErrorTrainer steps={flatSteps} />}
      {kind === 'occlusion' && flatSteps.length > 0 && <OcclusionTrainer steps={flatSteps} />}
      {kind === 'voice' && <VoiceRecallTrainer scenarioName={scenario.name !== 'default' ? scenario.name : station.title} steps={flatSteps} />}
      {kind === 'full' && (
        <StepOrderingGame
          key={`${station.id}::${scenario.name}::full`}
          station={{ ...station, id: `${station.id}::${scenario.name}`, steps: scenario.steps }}
          onFinish={(score) => saveProgress({ stationId: station.id, orderingBestScore: score, lastPracticedAt: Date.now() })}
          timeKey={`${station.id}::${scenario.name}::full`}
        />
      )}
    </div>
  );
}
