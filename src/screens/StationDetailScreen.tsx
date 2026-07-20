import { useEffect, useState } from 'react';
import { getStationById } from '@/data/stations';
import { getProgress, saveProgress } from '@/lib/db';
import { addXp } from '@/lib/streakAndXp';
import { StepOrderingGame } from '@/components/StepOrderingGame';
import { ScenarioComparisonView } from '@/components/ScenarioComparisonView';
import { BlockAccordionTrainer } from '@/components/BlockAccordionTrainer';
import { ZeroMistakeChallenge } from '@/components/ZeroMistakeChallenge';
import { InterleavingTrainer } from '@/components/InterleavingTrainer';
import { WhyThisStepButton } from '@/components/WhyThisStepButton';
import { CoreThenDiffTrainer } from '@/components/CoreThenDiffTrainer';
import { FindTheErrorTrainer } from '@/components/FindTheErrorTrainer';
import { OcclusionTrainer } from '@/components/OcclusionTrainer';
import { VoiceRecallTrainer } from '@/components/VoiceRecallTrainer';
import { MnemonicButton } from '@/components/MnemonicButton';
import { AudioNarration } from '@/components/AudioNarration';
import { Confetti } from '@/components/Confetti';
import { Icon } from '@/components/Icon';
import { getScenarioViewMode, setScenarioViewMode, type ScenarioViewMode } from '@/lib/scenarioViewMode';

type Tab = 'algo' | 'check' | 'order' | 'compare';
type OrderMode = 'blocks' | 'core-diff' | 'find-error' | 'occlusion' | 'voice' | 'full' | 'challenge' | 'interleave';

interface Props {
  stationId: string;
  onBack: () => void;
}

export function StationDetailScreen({ stationId, onBack }: Props) {
  const station = getStationById(stationId);
  const [tab, setTab] = useState<Tab>('algo');
  const [orderMode, setOrderMode] = useState<OrderMode>('blocks');
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [checklistDone, setChecklistDone] = useState<Record<string, boolean>>({});
  const [showConfetti, setShowConfetti] = useState(false);
  const [viewMode, setViewMode] = useState<ScenarioViewMode>(getScenarioViewMode);
  const [gridConfirmed, setGridConfirmed] = useState(false);

  function toggleViewMode() {
    const next: ScenarioViewMode = viewMode === 'inline' ? 'grid' : 'inline';
    setViewMode(next);
    setScenarioViewMode(next); // сохраняется глобально, применяется на все станции приложения
    setGridConfirmed(false);
  }

  useEffect(() => {
    getProgress(stationId).then((p) => setChecklistDone(p.checklistDone));
    setScenarioIndex(0);
    setTab('algo');
    setOrderMode('blocks');
    setShowModeSelector(false);
    setGridConfirmed(false);
  }, [stationId]);

  const scenarios = station?.scenarios;
  const hasMultipleScenarios = (scenarios?.length ?? 0) > 1;
  const activeScenario = scenarios?.[scenarioIndex] ?? scenarios?.[0];
  const activeSteps = activeScenario?.steps ?? station?.steps ?? [];
  const activeChecklist = activeScenario?.checklist ?? station?.checklist ?? [];
  const activeStepBlocks = activeScenario?.stepBlocks ?? [];
  const flatStepItems = activeStepBlocks.flatMap((b) => b.items);

  if (!station) return null;

  function toggle(key: string) {
    setChecklistDone((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      saveProgress({ stationId, checklistDone: next, lastPracticedAt: Date.now() });

      const total = activeChecklist.reduce((sum, b) => sum + b.items.length, 0);
      const doneNow = activeChecklist.reduce(
        (sum, b) => sum + b.items.filter((item) => next[`${activeScenario?.name ?? 'default'}::${b.block}::${item}`]).length,
        0,
      );
      if (total > 0 && doneNow === total && next[key]) {
        addXp(stationId, 20);
        setShowConfetti(true);
      }
      return next;
    });
  }

  return (
    <div>
      {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
      <div className="mb-4 flex items-center gap-2.5">
        <button onClick={onBack} aria-label="Назад" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container">
          <Icon name="arrow_back" size={18} />
        </button>
        <div className="flex-1">
          <div className="text-xs font-semibold uppercase tracking-wide text-primary">{station.category}</div>
          <h1 className="text-xl font-semibold">{station.title}</h1>
        </div>
        {hasMultipleScenarios && (
          <button
            onClick={toggleViewMode}
            aria-label="Переключить вид списка сценариев"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant"
            title={viewMode === 'inline' ? 'Показать сеткой с иконками' : 'Показать списком'}
          >
            <Icon name={viewMode === 'inline' ? 'grid_view' : 'compare'} size={16} />
          </button>
        )}
      </div>

      {hasMultipleScenarios && viewMode === 'grid' && !gridConfirmed ? (
        <div>
          <p className="mb-3 text-xs text-on-surface-variant">Выбери сценарий станции — определяется в день экзамена, можно потренировать любой.</p>
          <div className="grid grid-cols-2 gap-2.5">
            {scenarios!.map((sc, i) => (
              <button
                key={sc.name}
                onClick={() => {
                  setScenarioIndex(i);
                  setGridConfirmed(true);
                }}
                className="flex flex-col items-center gap-2 rounded-m3-md bg-surface-container-low p-4 text-center"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
                  <Icon name={station.icon as any} size={22} />
                </span>
                <span className="text-xs font-medium leading-snug">{sc.name}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          {hasMultipleScenarios && viewMode === 'grid' && gridConfirmed && (
            <button onClick={() => setGridConfirmed(false)} className="mb-3 flex items-center gap-1 text-xs font-semibold text-on-surface-variant">
              <Icon name="arrow_back" size={14} /> Все сценарии
            </button>
          )}

          {hasMultipleScenarios && viewMode === 'inline' && (
            <div className="mb-4">
              <div className="mb-1.5 text-xs text-on-surface-variant">
                Сценарий станции (определяется в день экзамена — можно потренировать любой):
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {scenarios!.map((sc, i) => (
                  <button
                    key={sc.name}
                    onClick={() => setScenarioIndex(i)}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-xs whitespace-nowrap ${
                      scenarioIndex === i
                        ? 'border-transparent bg-primary-container font-semibold text-on-primary-container'
                        : 'border-outline-variant text-on-surface-variant'
                    }`}
                  >
                    {sc.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {hasMultipleScenarios && viewMode === 'grid' && gridConfirmed && (
            <h2 className="mb-3 text-sm font-semibold text-primary">{activeScenario?.name}</h2>
          )}

      <div className="mb-4 flex gap-4 overflow-x-auto border-b border-outline-variant">
        {(
          [
            ['algo', 'Полный план'],
            ['order', 'Тренировка порядка'],
            ['check', 'Чек-лист'],
            ...(hasMultipleScenarios ? ([['compare', 'Сравнение']] as [Tab, string][]) : []),
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={[
              'shrink-0 border-b-2 pb-2.5 text-sm font-medium',
              tab === key ? 'border-primary text-primary font-semibold' : 'border-transparent text-on-surface-variant',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'algo' && (
        <>
          <p className="mb-3 text-xs text-on-surface-variant">
            Пошаговый алгоритм дословно по паспорту станции — этот же порядок используется в тренировке.
          </p>
          <AudioNarration steps={flatStepItems} />
          {activeStepBlocks.map((block) => (
            <div key={block.block} className="mb-4">
              <div className="mb-1.5 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-on-surface-variant">{block.block}</h2>
                <MnemonicButton stationId={stationId} stationTitle={station.title} blockName={block.block} itemTexts={block.items.map((i) => i.text)} />
              </div>
              {block.items.map((step, i) => (
                <div key={step.num} className="border-b border-outline-variant py-3 last:border-none">
                  <div className="flex gap-3">
                    <div className="flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full bg-secondary-container text-[11px] font-semibold text-on-secondary-container">
                      {step.num}
                    </div>
                    <p className="text-sm leading-relaxed">{step.text}</p>
                  </div>
                  <div className="pl-9">
                    <WhyThisStepButton
                      stationId={stationId}
                      stationTitle={station.title}
                      blockName={block.block}
                      stepNum={step.num}
                      stepText={step.text}
                      prevStep={block.items[i - 1]?.text}
                      nextStep={block.items[i + 1]?.text}
                    />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </>
      )}

      {tab === 'check' &&
        activeChecklist.map((block) => (
          <div key={block.block}>
            <h2 className="mt-4 mb-2 text-sm font-semibold text-on-surface-variant">{block.block}</h2>
            {block.items.map((item) => {
              const key = `${activeScenario?.name ?? 'default'}::${block.block}::${item}`;
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

      {tab === 'compare' && hasMultipleScenarios && <ScenarioComparisonView scenarios={scenarios!} />}

      {tab === 'order' && (
        <div>
          {!showModeSelector ? (
            <button
              onClick={() => setShowModeSelector(true)}
              className="mb-4 flex items-center gap-1 text-xs font-semibold text-on-surface-variant"
            >
              Другие режимы <Icon name="keyboard_arrow_down" size={14} />
            </button>
          ) : (
            <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
              {(
                [
                  ['blocks', 'По блокам'],
                  ...(hasMultipleScenarios ? ([['core-diff', 'Ядро → отличия']] as [OrderMode, string][]) : []),
                  ['interleave', 'Интерливинг'],
                  ['find-error', 'Найди ошибку'],
                  ['occlusion', 'Скрой и вспомни'],
                  ['voice', 'Расскажи вслух'],
                  ['challenge', 'Без права на ошибку'],
                  ['full', 'Всё целиком'],
                ] as [OrderMode, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setOrderMode(key)}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-xs whitespace-nowrap ${
                    orderMode === key
                      ? 'border-transparent bg-primary-container font-semibold text-on-primary-container'
                      : 'border-outline-variant text-on-surface-variant'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {orderMode === 'blocks' && activeStepBlocks.length > 0 && (
            <BlockAccordionTrainer key={activeScenario?.name} stationId={stationId} scenarioName={activeScenario?.name ?? 'default'} blocks={activeStepBlocks} />
          )}
          {orderMode === 'core-diff' && hasMultipleScenarios && (
            <CoreThenDiffTrainer stationId={stationId} scenarios={scenarios!} />
          )}
          {orderMode === 'interleave' && (
            <InterleavingTrainer excludeStationId={stationId} />
          )}
          {orderMode === 'find-error' && flatStepItems.length > 0 && (
            <FindTheErrorTrainer key={activeScenario?.name} steps={flatStepItems} />
          )}
          {orderMode === 'occlusion' && flatStepItems.length > 0 && (
            <OcclusionTrainer key={activeScenario?.name} steps={flatStepItems} />
          )}
          {orderMode === 'voice' && (
            <VoiceRecallTrainer scenarioName={activeScenario?.name ?? station.title} steps={flatStepItems} />
          )}
          {orderMode === 'challenge' && activeStepBlocks.length > 0 && (
            <ZeroMistakeChallenge key={activeScenario?.name} stationId={stationId} scenarioName={activeScenario?.name ?? 'default'} blocks={activeStepBlocks} />
          )}
          {orderMode === 'full' && (
            <StepOrderingGame
              key={`${stationId}::${scenarioIndex}::full`}
              station={{ ...station, id: `${station.id}::${scenarioIndex}`, steps: activeSteps }}
              onFinish={(score) => saveProgress({ stationId, checklistDone, orderingBestScore: score, lastPracticedAt: Date.now() })}
              timeKey={`${stationId}::${activeScenario?.name ?? 'default'}::full`}
            />
          )}
        </div>
      )}
        </>
      )}
    </div>
  );
}
