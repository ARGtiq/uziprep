import { useLiveQuery } from 'dexie-react-hooks';
import { listDueBlocks } from '@/lib/mastery';
import { Icon } from '@/components/Icon';

interface Props {
  onOpen: () => void;
}

/** "Сегодня повторить" — сколько блоков просрочены по мастерству (spaced repetition), прямая ссылка на дашборд. */
export function TodayReviewWidget({ onOpen }: Props) {
  const due = useLiveQuery(() => listDueBlocks(), [], []) ?? [];
  if (due.length === 0) return null;

  return (
    <button onClick={onOpen} className="mb-3 flex w-full items-center gap-3 rounded-m3-md bg-error/10 p-3.5 text-left">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-error/20 text-error">
        <Icon name="schedule" size={20} />
      </span>
      <div className="flex-1">
        <b className="text-sm text-error">Сегодня повторить: {due.length}</b>
        <div className="text-xs text-on-surface-variant">Блоки, которые пора закрепить — не откладывай</div>
      </div>
      <Icon name="arrow_forward" size={16} className="shrink-0 text-on-surface-variant" />
    </button>
  );
}
