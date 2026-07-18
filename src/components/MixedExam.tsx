import { useEffect, useMemo, useState } from 'react';
import { STATIONS } from '@/data/stations';
import type { QuizQuestion, Station } from '@/types/station';
import { StepOrderingGame } from '@/components/StepOrderingGame';
import { Icon } from '@/components/Icon';

type ExamItem =
  | { kind: 'mcq'; question: QuizQuestion }
  | { kind: 'ordering'; station: Station };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Смешивает MCQ-вопросы и задания "собери порядок" в одну колоду.
 * Пропорция ~70/30 — ordering-заданий меньше, они дольше проходятся.
 * Если реальных вопросов/станций меньше запрошенного — берём сколько
 * есть, без дублирования одного и того же задания.
 */
function buildExamPool(count: number): ExamItem[] {
  const mcqPool: ExamItem[] = shuffle(STATIONS.flatMap((s) => s.quiz ?? [])).map((q) => ({ kind: 'mcq', question: q }));
  const orderingPool: ExamItem[] = shuffle(STATIONS.filter((s) => s.steps.length >= 3)).map((s) => ({ kind: 'ordering', station: s }));

  const orderingCount = Math.min(orderingPool.length, Math.round(count * 0.3));
  const mcqCount = Math.min(mcqPool.length, count - orderingCount);

  const items = [...mcqPool.slice(0, mcqCount), ...orderingPool.slice(0, orderingCount)];
  return shuffle(items);
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

export function MixedExam({ questionCount, secondsPerRun, onExit }: Props) {
  const items = useMemo(() => buildExamPool(questionCount), [questionCount]);
  const [index, setIndex] = useState(0);
  const [scores, setScores] = useState<(number | null)[]>(() => items.map(() => null));
  const [mcqSelected, setMcqSelected] = useState<number | null>(null);
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

  if (items.length === 0) {
    return (
      <div>
        <p className="text-sm text-on-surface-variant mb-4">
          Пока недостаточно материала для экзамена — добавь вопросы или станции с алгоритмом из 3+ шагов.
        </p>
        <button onClick={onExit} className="rounded-full border border-outline-variant px-4 py-2 text-sm">
          Назад
        </button>
      </div>
    );
  }

  if (finished) {
    const answered = scores.filter((s) => s !== null) as number[];
    const totalRatio = answered.length ? answered.reduce((a, b) => a + b, 0) / items.length : 0;
    const percent = Math.round(totalRatio * 100);
    return (
      <div className="py-6 text-center">
        <Icon
          name={percent >= 70 ? 'workspace_premium' : 'refresh'}
          size={48}
          className="mx-auto text-primary"
        />
        <h1 className="mt-3 text-xl font-semibold">{percent}%</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Отвечено: {answered.length} из {items.length}
          {percent >= 70 ? ' · хороший результат' : ' · стоит повторить материал'}
        </p>
        <button onClick={onExit} className="mt-6 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-on-primary">
          Вернуться к станциям
        </button>
      </div>
    );
  }

  const item = items[index];
  const itemAnswered = scores[index] !== null;

  function goNext() {
    setMcqSelected(null);
    if (index + 1 < items.length) setIndex(index + 1);
    else setFinished(true);
  }

  function selectMcq(optionIndex: number, q: QuizQuestion) {
    if (mcqSelected !== null) return;
    setMcqSelected(optionIndex);
    setScores((prev) => {
      const next = [...prev];
      next[index] = optionIndex === q.correctIndex ? 1 : 0;
      return next;
    });
  }

  function finishOrdering(ratio: number) {
    setScores((prev) => {
      const next = [...prev];
      next[index] = ratio;
      return next;
    });
  }

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <button onClick={onExit} aria-label="Выйти" className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container">
          <Icon name="close" size={18} />
        </button>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-container">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(index / items.length) * 100}%` }} />
        </div>
        <span className="text-xs text-on-surface-variant">{index + 1} / {items.length}</span>
        <div
          className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold ${
            secondsLeft <= 30 ? 'bg-error/15 text-error' : 'bg-primary-container text-on-primary-container'
          }`}
        >
          <Icon name="schedule" size={14} />
          {formatTime(secondsLeft)}
        </div>
      </div>

      {item.kind === 'mcq' ? (
        <div>
          <div className="mb-3 inline-flex items-center gap-1 rounded-full bg-secondary-container px-2.5 py-1 text-xs font-semibold text-on-secondary-container">
            Вопрос
          </div>
          <h1 className="mb-5 text-lg font-medium leading-snug">{item.question.question}</h1>
          <div className="flex flex-col gap-2.5">
            {item.question.options.map((opt, i) => {
              const isSelected = mcqSelected === i;
              const isCorrectOption = i === item.question.correctIndex;
              const showResult = mcqSelected !== null;
              let cls = 'border-outline-variant';
              if (showResult && isCorrectOption) cls = 'border-primary bg-primary-container';
              else if (showResult && isSelected && !isCorrectOption) cls = 'border-error bg-error/10';
              return (
                <button
                  key={i}
                  onClick={() => selectMcq(i, item.question)}
                  disabled={showResult}
                  className={`flex items-center gap-3 rounded-m3-md border p-3.5 text-left text-sm ${cls}`}
                >
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${isSelected ? 'border-primary' : 'border-outline'}`}>
                    {isSelected && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                  </span>
                  {opt}
                  {showResult && isCorrectOption && <Icon name="check_circle" size={18} className="ml-auto text-primary" />}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-3 inline-flex items-center gap-1 rounded-full bg-secondary-container px-2.5 py-1 text-xs font-semibold text-on-secondary-container">
            Собери порядок
          </div>
          <h1 className="mb-4 text-lg font-medium leading-snug">{item.station.title}</h1>
          <StepOrderingGame key={index} station={item.station} onFinish={finishOrdering} allowRetry={false} />
        </div>
      )}

      {itemAnswered && (
        <button onClick={goNext} className="mt-5 w-full rounded-full bg-primary py-3 text-sm font-semibold text-on-primary">
          {index + 1 < items.length ? 'Далее' : 'Завершить'}
        </button>
      )}
    </div>
  );
}
