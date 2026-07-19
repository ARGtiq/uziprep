import { useMemo, useState } from 'react';
import type { StepBlock, StepItem } from '@/types/station';
import { Icon } from '@/components/Icon';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface SingleBlockResult {
  mistakes: number;
  total: number;
}

interface Props {
  block: StepBlock;
  /** Ключ для пересборки при смене блока — обычно имя блока */
  resetKey: string;
  onChecked: (result: SingleBlockResult) => void;
  /** Показывать кнопку "Дальше"/повтор — false, если родитель сам управляет переходом (например, челлендж без права на повтор) */
  showAdvanceControls?: boolean;
  onAdvance?: () => void;
  advanceLabel?: string;
}

/**
 * Общая механика перетаскивания карточек одного блока — вынесена
 * отдельно, чтобы BlockAccordionTrainer и ZeroMistakeChallenge не
 * дублировали одну и ту же логику drag/drop и не расходились багами.
 */
export function SingleBlockOrdering({ block, resetKey, onChecked, showAdvanceControls = true, onAdvance, advanceLabel = 'Дальше' }: Props) {
  const [cards, setCards] = useState<StepItem[]>(() => shuffle(block.items));
  const [checked, setChecked] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [dragKey, setDragKey] = useState<string | null>(null);

  useMemo(() => {
    setCards(shuffle(block.items));
    setChecked(false);
    setMistakes(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const correctOrder = block.items.map((i) => i.num);

  function handleDragStart(num: string) {
    setDragKey(num);
  }
  function handleDropOn(targetNum: string) {
    if (!dragKey || dragKey === targetNum) return;
    setCards((prev) => {
      const next = [...prev];
      const from = next.findIndex((c) => c.num === dragKey);
      const to = next.findIndex((c) => c.num === targetNum);
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDragKey(null);
  }
  function moveCard(index: number, dir: -1 | 1) {
    setCards((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function check() {
    const m = cards.filter((c, i) => c.num !== correctOrder[i]).length;
    setMistakes(m);
    setChecked(true);
    onChecked({ mistakes: m, total: cards.length });
  }

  return (
    <div>
      <div className="flex flex-col gap-2">
        {cards.map((card, i) => {
          const isCorrect = checked && card.num === correctOrder[i];
          const isWrong = checked && card.num !== correctOrder[i];
          return (
            <div
              key={card.num}
              draggable={!checked}
              onDragStart={() => handleDragStart(card.num)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDropOn(card.num)}
              className={[
                'flex items-center gap-2.5 rounded-m3-md border p-3 text-sm',
                checked
                  ? isCorrect
                    ? 'border-transparent bg-primary-container'
                    : 'border-error bg-error/10'
                  : 'border-transparent bg-surface-container-low cursor-grab active:cursor-grabbing',
              ].join(' ')}
            >
              <Icon name="drag_indicator" size={16} className="shrink-0 text-on-surface-variant" />
              <p className="flex-1">{card.text}</p>
              {!checked && (
                <div className="flex flex-col md:hidden">
                  <button onClick={() => moveCard(i, -1)} aria-label="Выше">
                    <Icon name="keyboard_arrow_up" size={16} />
                  </button>
                  <button onClick={() => moveCard(i, 1)} aria-label="Ниже">
                    <Icon name="keyboard_arrow_down" size={16} />
                  </button>
                </div>
              )}
              {isWrong && <Icon name="cancel" size={16} className="text-error" />}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex gap-3">
        {!checked ? (
          <button onClick={check} className="flex-1 rounded-full bg-primary py-2.5 text-sm font-semibold text-on-primary">
            Проверить блок
          </button>
        ) : (
          showAdvanceControls && (
            <button onClick={onAdvance} className="flex-1 rounded-full bg-primary py-2.5 text-sm font-semibold text-on-primary">
              {advanceLabel}
            </button>
          )
        )}
      </div>
      {checked && (
        <p className="mt-2 text-center text-xs text-on-surface-variant">
          {mistakes === 0 ? 'Блок собран без ошибок' : `Ошибок: ${mistakes} из ${block.items.length}`}
        </p>
      )}
    </div>
  );
}
