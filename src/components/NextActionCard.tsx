import { useEffect, useState } from 'react';
import { getNextAction, type NextAction } from '@/lib/nextAction';
import { findBlockContent } from '@/lib/findBlock';
import { recordBlockResult } from '@/lib/mastery';
import { addXp } from '@/lib/streakAndXp';
import { SingleBlockOrdering, type SingleBlockResult } from '@/components/SingleBlockOrdering';
import { Confetti } from '@/components/Confetti';
import { Icon } from '@/components/Icon';

interface Props {
  onOpenWeakSpots: () => void;
  onOpenStation: (stationId: string) => void;
  onGoExam: () => void;
}

const KIND_ICON: Record<NextAction['kind'], any> = {
  'due-block': 'schedule',
  'wrong-questions': 'refresh',
  'streak-risk': 'emergency',
  'start-fresh': 'auto_awesome',
  'keep-going': 'check_circle',
};

const KIND_COLOR: Record<NextAction['kind'], string> = {
  'due-block': 'bg-error/10 text-error',
  'wrong-questions': 'bg-error/10 text-error',
  'streak-risk': 'bg-secondary-container text-on-secondary-container',
  'start-fresh': 'bg-primary-container text-on-primary-container',
  'keep-going': 'bg-primary-container text-on-primary-container',
};

/**
 * Единая рекомендация "что делать дальше" вместо трёх разрозненных
 * виджетов на главном экране — один вход, один явный CTA. Для
 * просроченного блока можно потренировать прямо тут, инлайн, без
 * перехода на страницу станции (findBlockContent достаёт реальные
 * карточки по идентификаторам из mastery).
 */
export function NextActionCard({ onOpenWeakSpots, onOpenStation, onGoExam }: Props) {
  const [action, setAction] = useState<NextAction | null>(null);
  const [showInline, setShowInline] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [inlineDone, setInlineDone] = useState(false);

  useEffect(() => {
    getNextAction().then(setAction);
  }, []);

  if (!action) return null;

  function handleClick() {
    if (!action) return;
    if (action.kind === 'due-block' && action.stationId) onOpenStation(action.stationId);
    else if (action.kind === 'wrong-questions') onGoExam();
  }

  function handleInlineChecked(result: SingleBlockResult) {
    if (!action?.stationId || !action.scenarioName || !action.blockName) return;
    recordBlockResult(action.stationId, action.scenarioName, action.blockName, result.mistakes === 0);
    addXp(action.stationId, result.mistakes === 0 ? 5 : 1);
    if (result.mistakes === 0) setShowConfetti(true);
    setInlineDone(true);
  }

  const clickable = action.kind === 'due-block' || action.kind === 'wrong-questions';
  const inlineBlock =
    showInline && action.stationId && action.scenarioName && action.blockName
      ? findBlockContent(action.stationId, action.scenarioName, action.blockName)
      : null;

  const content = (
    <>
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${KIND_COLOR[action.kind]}`}>
        <Icon name={KIND_ICON[action.kind]} size={20} />
      </span>
      <div className="flex-1 text-left">
        <b className="text-sm">{action.title}</b>
        <div className="text-xs text-on-surface-variant">{action.subtitle}</div>
      </div>
      {clickable && <Icon name="arrow_forward" size={16} className="shrink-0 text-on-surface-variant" />}
    </>
  );

  return (
    <div className="mb-3 rounded-m3-md bg-surface-container-low p-3.5">
      {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
      {clickable ? (
        <button onClick={handleClick} className="flex w-full items-center gap-3 text-left">
          {content}
        </button>
      ) : (
        <div className="flex items-center gap-3">{content}</div>
      )}

      {action.kind === 'due-block' && action.blockName && (
        <button
          onClick={() => setShowInline((v) => !v)}
          className="mt-2.5 flex items-center gap-1 text-xs font-semibold text-primary"
        >
          <Icon name={showInline ? 'cancel' : 'grid_view'} size={12} />
          {showInline ? 'Свернуть' : 'Тренировать прямо здесь'}
        </button>
      )}

      {inlineBlock && !inlineDone && (
        <div className="mt-3">
          <SingleBlockOrdering block={inlineBlock} resetKey={inlineBlock.block} onChecked={handleInlineChecked} showAdvanceControls={false} />
        </div>
      )}
      {inlineDone && <p className="mt-3 text-center text-xs text-on-surface-variant">Готово — обновится при следующем заходе на главную</p>}
    </div>
  );
}
