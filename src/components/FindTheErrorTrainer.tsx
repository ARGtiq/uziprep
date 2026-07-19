import { useMemo, useState } from 'react';
import type { StepItem } from '@/types/station';
import { Icon } from '@/components/Icon';

interface Props {
  steps: StepItem[];
  onFinish?: (correct: boolean) => void;
}

function swapTwoRandom<T>(arr: T[]): { result: T[]; swappedIndices: [number, number] } {
  const a = [...arr];
  const i = Math.floor(Math.random() * a.length);
  let j = Math.floor(Math.random() * a.length);
  while (j === i) j = Math.floor(Math.random() * a.length);
  [a[i], a[j]] = [a[j], a[i]];
  return { result: a, swappedIndices: [Math.min(i, j), Math.max(i, j)] };
}

/**
 * Облегчённый режим повторения: почти правильная последовательность
 * с двумя переставленными местами шагами — задача найти оба и
 * тапнуть на них, а не пересобирать всё заново. Годится как второй
 * заход после того, как полный ordering уже пройден хотя бы раз —
 * заметно быстрее физически, держит внимание на структуре, а не на
 * механике перетаскивания.
 */
export function FindTheErrorTrainer({ steps, onFinish }: Props) {
  const { shuffled, swappedIndices } = useMemo(() => {
    const { result, swappedIndices } = swapTwoRandom(steps);
    return { shuffled: result, swappedIndices };
  }, [steps]);

  const [selected, setSelected] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);

  function toggle(i: number) {
    if (checked) return;
    setSelected((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : prev.length < 2 ? [...prev, i] : prev));
  }

  function check() {
    setChecked(true);
    const correct = selected.length === 2 && selected.sort((a, b) => a - b).every((v, i) => v === swappedIndices[i]);
    onFinish?.(correct);
  }

  const isCorrectFind = checked && selected.length === 2 && [...selected].sort((a, b) => a - b).every((v, i) => v === swappedIndices[i]);

  return (
    <div>
      <p className="mb-3 text-xs text-on-surface-variant">
        Два шага в этом списке переставлены местами. Найди оба (тапни на них) и проверь.
      </p>
      <div className="flex flex-col gap-1.5">
        {shuffled.map((step, i) => {
          const isSelected = selected.includes(i);
          const isSwapped = checked && swappedIndices.includes(i);
          return (
            <button
              key={step.num}
              onClick={() => toggle(i)}
              disabled={checked}
              className={[
                'flex items-center gap-2.5 rounded-m3-md border p-2.5 text-left text-sm',
                isSwapped ? 'border-error bg-error/10' : isSelected ? 'border-primary bg-primary-container' : 'border-transparent bg-surface-container-low',
              ].join(' ')}
            >
              <span className="w-5 shrink-0 text-xs text-on-surface-variant">{i + 1}</span>
              <span className="flex-1">{step.text}</span>
              {isSwapped && <Icon name="cancel" size={14} className="text-error" />}
            </button>
          );
        })}
      </div>

      {!checked ? (
        <button
          onClick={check}
          disabled={selected.length !== 2}
          className="mt-4 w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-on-primary disabled:opacity-40"
        >
          Проверить ({selected.length}/2 выбрано)
        </button>
      ) : (
        <p className={`mt-3 text-center text-sm font-semibold ${isCorrectFind ? 'text-primary' : 'text-error'}`}>
          {isCorrectFind ? 'Верно найдено!' : 'Не совсем — ошибки подсвечены красным'}
        </p>
      )}
    </div>
  );
}
