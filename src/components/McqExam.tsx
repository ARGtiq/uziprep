import { useEffect, useMemo, useState } from 'react';
import { STATIONS } from '@/data/stations';
import type { QuizQuestion } from '@/types/station';
import { Icon } from '@/components/Icon';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuestionPool(count: number): QuizQuestion[] {
  const all = STATIONS.flatMap((s) => s.quiz ?? []);
  const shuffled = shuffle(all);
  // если реальных вопросов меньше, чем запрошено — берём сколько есть,
  // не дублируем (честнее, чем повторять один и тот же вопрос)
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

interface Props {
  questionCount: number;
  secondsPerRun: number;
  onExit: () => void;
}

export function McqExam({ questionCount, secondsPerRun, onExit }: Props) {
  const questions = useMemo(() => buildQuestionPool(questionCount), [questionCount]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [secondsLeft, setSecondsLeft] = useState(secondsPerRun);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (finished) return;
    if (secondsLeft <= 0) {
      setFinished(true);
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, finished]);

  if (questions.length === 0) {
    return (
      <div>
        <p className="text-sm text-on-surface-variant mb-4">
          Пока недостаточно вопросов в базе. Добавь ещё паспортов станций с полем quiz.
        </p>
        <button onClick={onExit} className="rounded-full border border-outline-variant px-4 py-2 text-sm">
          Назад
        </button>
      </div>
    );
  }

  if (finished) {
    const correct = answers.filter((a, i) => a === questions[i].correctIndex).length;
    const ratio = correct / questions.length;
    return (
      <div className="text-center py-6">
        <Icon name={ratio >= 0.7 ? 'workspace_premium' : 'refresh'} size={48} className="text-primary mx-auto" />
        <h1 className="mt-3 text-xl font-semibold">
          {correct} из {questions.length}
        </h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          {ratio >= 0.7 ? 'Хороший результат' : 'Стоит повторить материал'}
        </p>
        <button onClick={onExit} className="mt-6 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-on-primary">
          Вернуться к станциям
        </button>
      </div>
    );
  }

  const q = questions[index];
  const selected = answers[index];

  function select(optionIndex: number) {
    if (selected !== null) return; // не даём менять ответ после выбора
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = optionIndex;
      return next;
    });
  }

  function next() {
    if (index + 1 < questions.length) setIndex(index + 1);
    else setFinished(true);
  }

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <button onClick={onExit} aria-label="Выйти" className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container">
          <Icon name="close" size={18} />
        </button>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-container">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${((index + (selected !== null ? 1 : 0)) / questions.length) * 100}%` }}
          />
        </div>
        <span className="text-xs text-on-surface-variant">{index + 1} / {questions.length}</span>
        <div
          className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold ${
            secondsLeft <= 30 ? 'bg-error/15 text-error' : 'bg-primary-container text-on-primary-container'
          }`}
        >
          <Icon name="schedule" size={14} />
          {formatTime(secondsLeft)}
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
            <button
              key={i}
              onClick={() => select(i)}
              disabled={showResult}
              className={`flex items-center gap-3 rounded-m3-md border p-3.5 text-left text-sm ${cls}`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                  isSelected ? 'border-primary' : 'border-outline'
                }`}
              >
                {isSelected && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
              </span>
              {opt}
              {showResult && isCorrectOption && <Icon name="check_circle" size={18} className="ml-auto text-primary" />}
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <button onClick={next} className="mt-5 w-full rounded-full bg-primary py-3 text-sm font-semibold text-on-primary">
          {index + 1 < questions.length ? 'Далее' : 'Завершить'}
        </button>
      )}
    </div>
  );
}
