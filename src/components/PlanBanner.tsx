import { useState } from 'react';
import { getPlanProgress } from '@/lib/studyPlan';
import { STEPS } from '@/screens/StudyPlanScreen';
import { Icon } from '@/components/Icon';

interface Props {
  onOpen: () => void;
}

/**
 * Раньше "План" был отдельной 5-й вкладкой навигации — постоянно
 * занимала место, даже когда все этапы уже пройдены. Теперь это
 * баннер на главной, который меняет вид по статусу и схлопывается
 * в маленькую ссылку, когда план полностью пройден.
 */
export function PlanBanner({ onOpen }: Props) {
  const [progress] = useState(getPlanProgress);
  const doneCount = STEPS.filter((s) => progress[s.id]).length;
  const allDone = doneCount === STEPS.length;
  const started = doneCount > 0;

  if (allDone) {
    return (
      <button onClick={onOpen} className="mb-3 text-xs font-semibold text-on-surface-variant underline">
        Показать план ещё раз
      </button>
    );
  }

  return (
    <button onClick={onOpen} className="mb-3 flex w-full items-center gap-3 rounded-m3-md bg-primary-container p-3.5 text-left">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-m3-md bg-primary text-on-primary">
        <Icon name="workspace_premium" size={20} />
      </span>
      <div className="flex-1">
        <b className="text-sm text-on-primary-container">{started ? `Продолжить план (${doneCount}/${STEPS.length})` : 'Ещё не начинал?'}</b>
        <div className="text-xs text-on-surface-variant">{started ? 'Осталось совсем немного' : 'Вот с чего лучше начать подготовку'}</div>
      </div>
      <Icon name="arrow_forward" size={16} className="shrink-0 text-on-surface-variant" />
    </button>
  );
}
