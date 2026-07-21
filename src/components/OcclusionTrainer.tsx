import { useEffect, useMemo, useState } from 'react';
import type { StepItem } from '@/types/station';
import { Icon } from '@/components/Icon';
import { Confetti } from '@/components/Confetti';
import { addXp } from '@/lib/streakAndXp';

interface Props {
  steps: StepItem[];
  stationId?: string;
}

/** Прячем 2-4 значимых слова (длиннее 4 букв) в каждом шаге под плашку. */
function occludeText(text: string): { display: string; hidden: string[] } {
  const words = text.split(' ');
  const candidates = words
    .map((w, i) => ({ w, i }))
    .filter(({ w }) => w.replace(/[.,;:()«»]/g, '').length > 4);
  const count = Math.min(candidates.length, Math.max(1, Math.round(candidates.length * 0.25)));
  const shuffled = [...candidates].sort(() => Math.random() - 0.5).slice(0, count);
  const hideSet = new Set(shuffled.map((c) => c.i));
  const hidden = shuffled.map((c) => c.w);
  const display = words.map((w, i) => (hideSet.has(i) ? '█'.repeat(Math.min(w.length, 8)) : w)).join(' ');
  return { display, hidden };
}

/**
 * Occlusion-режим: показываем шаг с частью слов, скрытых плашками —
 * нужно вспомнить/проговорить пропущенное, потом раскрыть. Не
 * оценивается автоматически (это не тест, а активное вспоминание),
 * пользователь сам отмечает "вспомнил" / "не вспомнил" для следующего
 * шага-подсказки, что показывает прогресс по карточке.
 */
export function OcclusionTrainer({ steps, stationId }: Props) {
  const cards = useMemo(() => steps.map((s) => ({ ...s, ...occludeText(s.text) })), [steps]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState<Record<number, boolean>>({});
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiShown, setConfettiShown] = useState(false);

  const done = index >= cards.length;

  useEffect(() => {
    if (!done || confettiShown) return;
    setConfettiShown(true);
    const rememberedCount = Object.values(results).filter(Boolean).length;
    if (cards.length > 0 && rememberedCount / cards.length >= 0.7) {
      setShowConfetti(true);
      addXp(stationId ?? 'exam', 10);
    }
  }, [done, confettiShown, results, cards.length, stationId]);

  const card = cards[index];

  function mark(remembered: boolean) {
    setResults((prev) => ({ ...prev, [index]: remembered }));
    addXp(stationId ?? 'exam', remembered ? 2 : 1);
    setRevealed(false);
    setIndex((i) => i + 1);
  }

  if (done) {
    const rememberedCount = Object.values(results).filter(Boolean).length;
    return (
      <div className="py-6 text-center">
        {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
        <Icon name="check_circle" size={40} className="mx-auto text-primary" />
        <h2 className="mt-3 text-lg font-semibold">
          Вспомнено {rememberedCount} из {cards.length}
        </h2>
        <button
          onClick={() => {
            setIndex(0);
            setResults({});
          }}
          className="mt-4 rounded-full border border-outline-variant px-4 py-2 text-sm font-semibold"
        >
          Пройти ещё раз
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-xs text-on-surface-variant">
        <span>
          {index + 1} / {cards.length}
        </span>
        <span>{card.num} по паспорту</span>
      </div>

      <div className="mb-4 rounded-m3-md bg-surface-container-low p-4 text-sm leading-relaxed">
        {revealed ? card.text : card.display}
      </div>

      {!revealed ? (
        <button onClick={() => setRevealed(true)} className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-on-primary">
          Показать пропущенное
        </button>
      ) : (
        <div className="flex gap-2.5">
          <button onClick={() => mark(false)} className="flex-1 rounded-full border border-outline-variant py-2.5 text-sm font-semibold">
            Не вспомнил
          </button>
          <button onClick={() => mark(true)} className="flex-1 rounded-full bg-primary py-2.5 text-sm font-semibold text-on-primary">
            Вспомнил
          </button>
        </div>
      )}
    </div>
  );
}
