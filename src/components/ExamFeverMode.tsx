import { useEffect, useState } from 'react';
import { STATIONS } from '@/data/stations';
import type { QuizQuestion } from '@/types/station';
import { Icon } from '@/components/Icon';
import { recordQuestionResult } from '@/lib/questionStats';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const START_SECONDS = 15;
const MIN_SECONDS = 5;
const SECONDS_STEP = 1; // на сколько сокращается лимит с каждым следующим верным ответом

interface Props {
  onExit: () => void;
}

/**
 * "Экзаменационная лихорадка": один неверный ответ или не уложился в
 * таймер — серия обрывается. Каждый следующий вопрос даёт чуть меньше
 * времени (до пола в MIN_SECONDS), тренирует именно скорость принятия
 * решения под давлением, а не просто знание материала.
 */
export function ExamFeverMode({ onExit }: Props) {
  const [questions] = useState<QuizQuestion[]>(() => shuffle(STATIONS.flatMap((s) => s.quiz ?? [])));
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(START_SECONDS);
  const [gameOver, setGameOver] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [bestStreak, setBestStreak] = useState(() => {
    const raw = localStorage.getItem('uziprep.fever.best');
    return raw ? Number(raw) : 0;
  });

  const currentLimit = Math.max(MIN_SECONDS, START_SECONDS - index * SECONDS_STEP);
  const q = questions[index];

  useEffect(() => {
    if (gameOver || !q) return;
    if (secondsLeft <= 0) {
      setTimedOut(true);
      setGameOver(true);
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, gameOver, q]);

  useEffect(() => {
    if (gameOver && index > bestStreak) {
      setBestStreak(index);
      localStorage.setItem('uziprep.fever.best', String(index));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameOver]);

  if (!q || questions.length === 0) {
    return (
      <div>
        <p className="mb-4 text-sm text-on-surface-variant">В базе пока нет вопросов для этого режима.</p>
        <button onClick={onExit} className="rounded-full border border-outline-variant px-4 py-2 text-sm">
          Назад
        </button>
      </div>
    );
  }

  function select(i: number) {
    if (selected !== null || gameOver) return;
    setSelected(i);
    const correct = i === q.correctIndex;
    recordQuestionResult(q.id, correct);
    if (!correct) {
      setTimedOut(false);
      setGameOver(true);
    }
  }

  function next() {
    const nextIndex = index + 1;
    if (nextIndex >= questions.length) {
      setGameOver(true);
      return;
    }
    setIndex(nextIndex);
    setSelected(null);
    setSecondsLeft(Math.max(MIN_SECONDS, START_SECONDS - nextIndex * SECONDS_STEP));
  }

  if (gameOver) {
    return (
      <div className="py-6 text-center">
        <Icon name={timedOut ? 'schedule' : 'cancel'} size={44} className="mx-auto text-error" />
        <h2 className="mt-3 text-lg font-semibold">{timedOut ? 'Время вышло' : 'Неверный ответ'}</h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          Серия: {index} {index === bestStreak && index > 0 ? '— новый личный рекорд!' : `(рекорд: ${bestStreak})`}
        </p>
        <button onClick={onExit} className="mt-4 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary">
          Вернуться
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <button onClick={onExit} aria-label="Выйти" className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container">
          <Icon name="close" size={18} />
        </button>
        <div className="text-xs text-on-surface-variant">Серия: {index}</div>
        <div
          className={`ml-auto flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold ${
            secondsLeft <= 3 ? 'bg-error/15 text-error' : 'bg-primary-container text-on-primary-container'
          }`}
        >
          <Icon name="schedule" size={14} />
          {secondsLeft}с / {currentLimit}с
        </div>
      </div>

      <h1 className="mb-5 text-lg font-medium leading-snug">{q.question}</h1>

      <div className="flex flex-col gap-2.5">
        {q.options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrectOption = i === q.correctIndex;
          const showResult = selected !== null;
          let cls = 'border-outline-variant';
          if (showResult && isCorrectOption) cls = 'border-primary bg-primary-container';
          else if (showResult && isSelected && !isCorrectOption) cls = 'border-error bg-error/10';
          return (
            <button key={i} onClick={() => select(i)} disabled={showResult} className={`rounded-m3-md border p-3.5 text-left text-sm ${cls}`}>
              {opt}
            </button>
          );
        })}
      </div>

      {selected !== null && selected === q.correctIndex && (
        <button onClick={next} className="mt-5 w-full rounded-full bg-primary py-3 text-sm font-semibold text-on-primary">
          Дальше — станет ещё быстрее
        </button>
      )}
    </div>
  );
}
