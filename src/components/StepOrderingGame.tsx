import { useMemo, useState } from 'react';
import type { Station } from '@/types/station';
import { Icon } from '@/components/Icon';

interface CardItem {
  key: string;
  text: string;
  originalIndex: number;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Props {
  station: Station;
  onFinish: (scoreRatio: number) => void;
  allowRetry?: boolean;
}

/**
 * Режим "Собери последовательность": карточки шагов станции выдаются
 * в случайном порядке, пользователь перетаскивает их в правильный.
 * После проверки — какие карточки стоят на верном месте (зелёные),
 * какие нет (красные), с показом верного порядка.
 *
 * allowRetry=false используется внутри смешанного экзамена — там одна
 * попытка на вопрос, кнопку "Попробовать ещё раз" прячем, переход к
 * следующему заданию делает родительский компонент (MixedExam).
 */
export function StepOrderingGame({ station, onFinish, allowRetry = true }: Props) {
  const initial = useMemo<CardItem[]>(
    () => shuffle(station.steps.map((text, i) => ({ key: `${station.id}-${i}`, text, originalIndex: i }))),
    [station.id],
  );
  const [cards, setCards] = useState<CardItem[]>(initial);
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  function handleDragStart(key: string) {
    setDragKey(key);
  }

  function handleDropOn(targetKey: string) {
    if (!dragKey || dragKey === targetKey) return;
    setCards((prev) => {
      const next = [...prev];
      const from = next.findIndex((c) => c.key === dragKey);
      const to = next.findIndex((c) => c.key === targetKey);
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
    setChecked(true);
    const correctCount = cards.filter((c, i) => c.originalIndex === i).length;
    onFinish(correctCount / cards.length);
  }

  function reset() {
    setCards(shuffle(station.steps.map((text, i) => ({ key: `${station.id}-${i}`, text, originalIndex: i }))));
    setChecked(false);
  }

  return (
    <div>
      <p className="text-sm text-on-surface-variant mb-4">
        Перетащите карточки так, чтобы порядок действий соответствовал правильному алгоритму станции.
      </p>
      <div className="flex flex-col gap-2">
        {cards.map((card, i) => {
          const isCorrect = checked && card.originalIndex === i;
          const isWrong = checked && card.originalIndex !== i;
          return (
            <div
              key={card.key}
              draggable={!checked}
              onDragStart={() => handleDragStart(card.key)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDropOn(card.key)}
              className={[
                'flex items-center gap-3 rounded-m3-md border p-3 select-none transition-colors',
                checked
                  ? isCorrect
                    ? 'bg-primary-container border-transparent'
                    : 'bg-error/10 border-error'
                  : 'bg-surface-container-low border-transparent cursor-grab active:cursor-grabbing',
              ].join(' ')}
            >
              <Icon name="drag_indicator" size={18} className="text-on-surface-variant shrink-0" />
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary-container text-xs font-semibold text-on-secondary-container">
                {i + 1}
              </div>
              <p className="text-sm flex-1">{card.text}</p>
              {checked && <Icon name={isCorrect ? 'check_circle' : 'cancel'} size={18} className={isCorrect ? 'text-primary' : 'text-error'} />}
              {!checked && (
                <div className="flex flex-col -my-1 md:hidden">
                  <button aria-label="Переместить выше" className="text-on-surface-variant" onClick={() => moveCard(i, -1)}>
                    <Icon name="keyboard_arrow_up" size={18} />
                  </button>
                  <button aria-label="Переместить ниже" className="text-on-surface-variant" onClick={() => moveCard(i, 1)}>
                    <Icon name="keyboard_arrow_down" size={18} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex gap-3">
        {!checked ? (
          <button
            onClick={check}
            className="flex-1 rounded-full bg-primary py-3 text-sm font-semibold text-on-primary"
          >
            Проверить порядок
          </button>
        ) : allowRetry ? (
          <button
            onClick={reset}
            className="flex-1 rounded-full border border-outline-variant py-3 text-sm font-semibold"
          >
            Попробовать ещё раз
          </button>
        ) : null}
      </div>

      {checked && (
        <div className="mt-3 text-center text-sm text-on-surface-variant">
          Верно расставлено: {cards.filter((c, i) => c.originalIndex === i).length} из {cards.length}
        </div>
      )}

      {checked && cards.some((c, i) => c.originalIndex !== i) && (
        <div className="mt-4">
          <h2 className="mb-2 text-sm font-semibold text-on-surface-variant">Правильный порядок</h2>
          <ol className="flex flex-col gap-1.5">
            {station.steps.map((step, i) => (
              <li key={i} className="flex gap-2.5 text-sm">
                <span className="shrink-0 text-on-surface-variant">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
