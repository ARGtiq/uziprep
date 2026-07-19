import { useMemo, useState } from 'react';
import { STATIONS } from '@/data/stations';
import type { QuizQuestion } from '@/types/station';
import { markWarmupShown } from '@/lib/dailyWarmup';
import { Icon } from '@/components/Icon';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Props {
  onClose: () => void;
}

/**
 * Лёгкий daily-quest в духе Duolingo: до 5 случайных вопросов при
 * заходе в приложение, до основного контента. Полностью dismissible —
 * "×" закрывает без штрафа и без повторного показа сегодня же.
 */
export function DailyWarmupModal({ onClose }: Props) {
  const questions = useMemo<QuizQuestion[]>(() => shuffle(STATIONS.flatMap((s) => s.quiz ?? [])).slice(0, 5), []);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);

  if (questions.length === 0) return null; // нет вопросов в базе — разминку не показываем вовсе

  function dismiss() {
    markWarmupShown();
    onClose();
  }

  const q = questions[index];
  const isLast = index === questions.length - 1;

  function select(i: number) {
    if (selected !== null) return;
    setSelected(i);
    if (i === q.correctIndex) setCorrectCount((c) => c + 1);
  }

  function next() {
    if (isLast) {
      dismiss();
      return;
    }
    setSelected(null);
    setIndex((i) => i + 1);
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 md:items-center">
      <div className="w-full max-w-md rounded-t-m3-lg bg-surface p-5 md:rounded-m3-lg">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-primary">
            <Icon name="auto_awesome" size={16} />
            Ежедневная разминка
          </div>
          <button onClick={dismiss} aria-label="Закрыть" className="text-on-surface-variant">
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="mb-3 text-xs text-on-surface-variant">
          {index + 1} / {questions.length}
        </div>
        <h3 className="mb-4 text-base font-medium leading-snug">{q.question}</h3>
        <div className="mb-4 flex flex-col gap-2">
          {q.options.map((opt, i) => {
            const isCorrectOpt = i === q.correctIndex;
            const cls =
              selected === null
                ? 'border-outline-variant'
                : isCorrectOpt
                  ? 'border-primary bg-primary-container'
                  : selected === i
                    ? 'border-error bg-error/10'
                    : 'border-outline-variant opacity-60';
            return (
              <button key={i} onClick={() => select(i)} className={`rounded-m3-md border p-2.5 text-left text-sm ${cls}`}>
                {opt}
              </button>
            );
          })}
        </div>

        {selected !== null && (
          <button onClick={next} className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-on-primary">
            {isLast ? `Готово (${correctCount}/${questions.length} верно)` : 'Далее'}
          </button>
        )}
      </div>
    </div>
  );
}
