import { useState } from 'react';
import type { IntroDialogueRow } from '@/types/station';
import { Icon } from '@/components/Icon';

interface Props {
  rows: IntroDialogueRow[];
}

/**
 * "Таблица N. Примерные тексты вводной информации в рамках диалога
 * члена АПК и аккредитуемого лица" — что говорит экзаменатор в роли
 * пациента/диспетчера по ходу станции. Намеренно оформлено СОВСЕМ
 * иначе, чем основной алгоритм: пунктирная рамка, курсив, нейтральный
 * фон вместо карточек с номерами — читается как "это цитаты слов
 * другого человека", а не ещё один шаг протокола.
 */
export function IntroDialogueBox({ rows }: Props) {
  const [open, setOpen] = useState(false);
  if (rows.length === 0) return null;

  return (
    <div className="mb-4 rounded-m3-md border border-dashed border-outline-variant p-3.5">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-2 text-left">
        <Icon name="forum" size={16} className="shrink-0 text-on-surface-variant" />
        <span className="flex-1 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
          Реплики члена АПК по ходу станции
        </span>
        <Icon name={open ? 'cancel' : 'arrow_forward'} size={14} className="shrink-0 text-on-surface-variant" />
      </button>

      {open && (
        <div className="mt-3 flex flex-col gap-3">
          {rows.map((row, i) => (
            <div key={i}>
              <div className="text-[11px] text-on-surface-variant">{row.trigger}</div>
              <div className="text-sm italic leading-relaxed text-on-surface-variant">{row.text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
