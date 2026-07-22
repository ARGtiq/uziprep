import { useEffect, useState } from 'react';
import { getStationById } from '@/data/stations';
import { getProgress, saveProgress } from '@/lib/db';
import { addXp } from '@/lib/streakAndXp';
import { ScenarioComparisonView } from '@/components/ScenarioComparisonView';
import { WhyThisStepButton } from '@/components/WhyThisStepButton';
import { IntroDialogueBox } from '@/components/IntroDialogueBox';
import { boldFirstWord } from '@/lib/textDisplay';
import { summarizeBlockVerbs, CATEGORY_COLOR, CATEGORY_LABEL } from '@/lib/actionVerbs';
import { MnemonicButton } from '@/components/MnemonicButton';
import { AudioNarration } from '@/components/AudioNarration';
import { Confetti } from '@/components/Confetti';
import { Icon } from '@/components/Icon';
import { getScenarioViewMode, setScenarioViewMode, type ScenarioViewMode } from '@/lib/scenarioViewMode';

type Tab = 'algo' | 'check' | 'compare';

interface Props {
  stationId: string;
  onBack: () => void;
}

/**
 * Чисто учебный экран станции: полный план, чек-лист, сравнение
 * сценариев. Все тренировочные/тестовые режимы (по блокам, найди
 * ошибку, интерливинг, без права на ошибку и т.д.) вынесены в раздел
 * Экзамена — эта страница больше не отвечает за проверку себя,
 * только за изучение материала.
 */
export function StationDetailScreen({ stationId, onBack }: Props) {
  const station = getStationById(stationId);
  const [tab, setTab] = useState<Tab>('algo');
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
    setGridConfirmed(false);
  }, [stationId]);

  const scenarios = station?.scenarios;
  const hasMultipleScenarios = (scenarios?.length ?? 0) > 1;
  const activeScenario = scenarios?.[scenarioIndex] ?? scenarios?.[0];
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
          <p className="mb-3 text-xs text-on-surface-variant">Выбери сценарий станции — определяется в день экзамена, можно изучить любой.</p>
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
                Сценарий станции (определяется в день экзамена — можно изучить любой):
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
                Пошаговый алгоритм дословно по паспорту станции. Тренировать порядок и проверять себя — в разделе
                Экзамена.
              </p>
              <AudioNarration steps={flatStepItems} />
              {station.introDialogue && <IntroDialogueBox rows={station.introDialogue} />}
              {activeStepBlocks.map((block) => {
                const verbSummary = summarizeBlockVerbs(block.items.map((i) => i.text));
                return (
                <div key={block.block} className="mb-4">
                  <div className="mb-1.5 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-on-surface-variant">{block.block}</h2>
                  </div>
                  {verbSummary.length > 0 && (
                    <details className="mb-2">
                      <summary className="cursor-pointer list-none text-[11px] text-on-surface-variant opacity-70">
                        <span className="mr-1 inline-block [details[open]_&]:rotate-90">›</span>
                        {verbSummary.length} {verbSummary.length === 1 ? 'группа' : 'группы'} действий в блоке
                      </summary>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 pl-3 text-[11px] text-on-surface-variant">
                        {verbSummary.map(({ category, count }) => (
                          <span key={category} className="flex items-center gap-1">
                            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: CATEGORY_COLOR[category] }} />
                            {CATEGORY_LABEL[category]} ({count})
                          </span>
                        ))}
                      </div>
                    </details>
                  )}
                  <MnemonicButton stationId={stationId} stationTitle={station.title} blockName={block.block} itemTexts={block.items.map((i) => i.text)} />
                  {block.items.map((step, i) => (
                    <div
                      key={step.num}
                      className={`flex flex-wrap items-start gap-3 border-b border-outline-variant py-3 last:border-none ${
                        i > 0 && i % 4 === 0 ? 'mt-1.5 border-t-2 border-t-outline-variant pt-3' : ''
                      }`}
                    >
                      <div className="flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full bg-secondary-container text-[11px] font-semibold text-on-secondary-container">
                        {step.num}
                      </div>
                      <p className="min-w-0 flex-1 text-sm leading-relaxed">{boldFirstWord(step.text)}</p>
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
                  ))}
                </div>
                );
              })}
            </>
          )}

          {tab === 'check' && (
            <>
              {activeChecklist.map((block) => (
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

              {(() => {
                const total = activeChecklist.reduce((sum, b) => sum + b.items.length, 0);
                const done = activeChecklist.reduce(
                  (sum, b) => sum + b.items.filter((item) => checklistDone[`${activeScenario?.name ?? 'default'}::${b.block}::${item}`]).length,
                  0,
                );
                const percent = total > 0 ? Math.round((done / total) * 100) : 0;
                const PASS_THRESHOLD = 0.7; // условный порог для тренировки — не официальный проходной балл АПК
                const passed = total > 0 && done / total >= PASS_THRESHOLD;
                return (
                  <div className={`mt-4 flex items-center justify-between rounded-m3-md p-3.5 ${passed ? 'bg-primary-container' : 'bg-error/10'}`}>
                    <div>
                      <b className="text-sm">
                        {done} / {total} выполнено ({percent}%)
                      </b>
                      <div className="text-xs text-on-surface-variant">Условный порог {Math.round(PASS_THRESHOLD * 100)}% — не официальный проходной балл</div>
                    </div>
                    <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${passed ? 'bg-primary text-on-primary' : 'bg-error text-white'}`}>
                      {passed ? 'СДАЛ' : 'НЕ СДАЛ'}
                    </span>
                  </div>
                );
              })()}
            </>
          )}

          {tab === 'compare' && hasMultipleScenarios && <ScenarioComparisonView scenarios={scenarios!} />}
        </>
      )}
    </div>
  );
}
