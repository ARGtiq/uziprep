import { useEffect, useState } from 'react';
import { getNextAction, type NextAction } from '@/lib/nextAction';
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
 * виджетов на главном экране — один вход, один явный CTA.
 */
export function NextActionCard({ onOpenWeakSpots, onOpenStation, onGoExam }: Props) {
  const [action, setAction] = useState<NextAction | null>(null);

  useEffect(() => {
    getNextAction().then(setAction);
  }, []);

  if (!action) return null;

  function handleClick() {
    if (!action) return;
    if (action.kind === 'due-block' && action.stationId) onOpenStation(action.stationId);
    else if (action.kind === 'wrong-questions') onGoExam();
    else if (action.kind === 'due-block') onOpenWeakSpots();
  }

  const clickable = action.kind === 'due-block' || action.kind === 'wrong-questions';

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

  if (!clickable) {
    return <div className="mb-3 flex items-center gap-3 rounded-m3-md bg-surface-container-low p-3.5">{content}</div>;
  }

  return (
    <button onClick={handleClick} className="mb-3 flex w-full items-center gap-3 rounded-m3-md bg-surface-container-low p-3.5">
      {content}
    </button>
  );
}
