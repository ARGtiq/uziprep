import { useEffect, useMemo, useState } from 'react';
import type { StepItem } from '@/types/station';
import { detectActionVerb, CATEGORY_COLOR } from '@/lib/actionVerbs';
import { Icon } from '@/components/Icon';
import { Confetti } from '@/components/Confetti';
import { addXp } from '@/lib/streakAndXp';

interface Props {
  steps: StepItem[];
  stationId?: string;
}

type Mode = 'random' | 'verb';

/** Случайный режим: 2-4 значимых слова (длиннее 4 букв) под плашкой. */
function occludeRandom(text: string): { display: string; hidden: string[] } {
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

/** Прицельный режим: прячем ТОЛЬКО глагол-действие (см. lib/actionVerbs.ts) — тренирует именно грамматику "какое действие тут нужно", а не запоминание случайных слов. */
function occludeVerb(text: string): { display: string; hidden: string[] } | null {
  const detected = detectActionVerb(text);
  if (!detected) return null;
  const rest = text.slice(detected.verb.length);
  return { display: '█'.repeat(Math.min(detected.verb.length, 10)) + rest, hidden: [detected.verb] };
}

/**
 * Occlusion-режим: показываем шаг с частью слов, скрытых плашками —
 * нужно вспомнить/проговорить пропущенное, потом раскрыть. Не
 * оценивается автоматически (это не тест, а активное вспоминание),
 * пользователь сам отмечает "вспомнил" / "не вспомнил". Переключатель
 * "Случайные слова" / "Глагол действия" — второй режим тренирует
 * прицельно 12 глаголов-действий (см. lib/actionVerbs.ts), которые
 * покрывают ~80% "рабочей" части УЗИ-станций.
 */
export function OcclusionTrainer({ steps, stationId }: Props) {
  const [mode, setMode] = useState<Mode>('random');

  const cards = useMemo(() => {
    if (mode === 'random') {
      return steps.map((s) => ({ ...s, ...occludeRandom(s.text) }));
    }
    return steps
      .map((s) => {
        const occluded = occludeVerb(s.text);
        return occluded ? { ...s, ...occluded } : null;
      })
      .filter((c): c is StepItem & { display: string; hidden: string[] } => c !== null);
  }, [steps, mode]);

  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState<Record<number, boolean>>({});
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiShown, setConfettiShown] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setIndex(0);
    setRevealed(false);
    setResults({});
    setConfettiShown(false);
  }

  const done = index >= cards.length;

  useEffect(() => {
    if (!done || confettiShown || cards.length === 0) return;
    setConfettiShown(true);
    const rememberedCount = Object.values(results).filter(Boolean).length;
    if (rememberedCount / cards.length >= 0.7) {
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

  const modeSwitcher = (
    <div className="mb-3 flex gap-2">
      {(
        [
          ['random', 'Случайные слова'],
          ['verb', 'Глагол действия'],
        ] as [Mode, string][]
      ).map(([m, label]) => (
        <button
          key={m}
          onClick={() => switchMode(m)}
          className={`flex-1 rounded-full py-2 text-xs font-semibold ${mode === m ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'}`}
        >
          {label}
        </button>
      ))}
    </div>
  );

  if (cards.length === 0) {
    return (
      <div>
        {modeSwitcher}
        <p className="text-sm text-on-surface-variant">В этом наборе шагов нет узнаваемых глаголов-действий — попробуй "Случайные слова".</p>
      </div>
    );
  }

  if (done) {
    const rememberedCount = Object.values(results).filter(Boolean).length;
    return (
      <div>
        {modeSwitcher}
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
              setConfettiShown(false);
            }}
            className="mt-4 rounded-full border border-outline-variant px-4 py-2 text-sm font-semibold"
          >
            Пройти ещё раз
          </button>
        </div>
      </div>
    );
  }

  const revealedVerbCategory = mode === 'verb' ? detectActionVerb(card.text) : null;

  return (
    <div>
      {modeSwitcher}
      <div className="mb-3 flex items-center justify-between text-xs text-on-surface-variant">
        <span>
          {index + 1} / {cards.length}
        </span>
        <span>{card.num} по паспорту</span>
      </div>

      <div className="mb-4 rounded-m3-md bg-surface-container-low p-4 text-sm leading-relaxed">
        {revealed ? (
          revealedVerbCategory ? (
            <>
              <b style={{ color: CATEGORY_COLOR[revealedVerbCategory.category] }}>{revealedVerbCategory.verb}</b>
              {card.text.slice(revealedVerbCategory.verb.length)}
            </>
          ) : (
            card.text
          )
        ) : (
          card.display
        )}
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
