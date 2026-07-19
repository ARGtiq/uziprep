import { useEffect, useMemo, useRef, useState } from 'react';
import { STATIONS } from '@/data/stations';
import type { QuizQuestion, Station } from '@/types/station';
import { StepOrderingGame } from '@/components/StepOrderingGame';
import { Icon } from '@/components/Icon';
import { saveExamAttempt } from '@/lib/db';
import { recordQuestionResult } from '@/lib/questionStats';
import { getExamOrderingSteps } from '@/lib/scenarioComparison';

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
 *
 * Для ordering-пула берём не полный station.steps (у части станций
 * это 30–90 дословных пунктов — в 5-минутном формате одно такое
 * задание съело бы весь лимит времени), а getExamOrderingSteps():
 * для станций с несколькими сценариями — общее для всех сценариев
 * ядро (короче и всё ещё осмысленно самостоятельно), для остальных —
 * полный список, если он и так короткий. Станции, которым это не
 * помогает уложиться в порог, в экзамен просто не попадают — полная
 * версия остаётся в бесштрафном режиме "Тренировка без таймера".
 */
function buildExamPool(count: number, allowedStationIds?: string[]): ExamItem[] {
  const stationPool = allowedStationIds ? STATIONS.filter((s) => allowedStationIds.includes(s.id)) : STATIONS;

  const mcqPool: ExamItem[] = shuffle(stationPool.flatMap((s) => s.quiz ?? [])).map((q) => ({ kind: 'mcq', question: q }));

  const orderingCandidates = stationPool.map((s) => {
    const steps = getExamOrderingSteps(s);
    return steps ? { ...s, steps } : null;
  }).filter((s): s is Station => s !== null);

  const orderingPool: ExamItem[] = shuffle(orderingCandidates).map((s) => ({ kind: 'ordering', station: s }));

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
  /** Если задано — пул строится только из этих станций (для режима "По пройденным") */
  allowedStationIds?: string[];
}

export function MixedExam({ questionCount, secondsPerRun, onExit, allowedStationIds }: Props) {
  const items = useMemo(() => buildExamPool(questionCount, allowedStationIds), [questionCount, allowedStationIds]);
  const [index, setIndex] = useState(0);
  const [scores, setScores] = useState<(number | null)[]>(() => items.map(() => null));
  const [mcqSelected, setMcqSelected] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(secondsPerRun);
  const [finished, setFinished] = useState(false);
  const startedAtRef = useRef(Date.now());
  const savedRef = useRef(false);
  const scoresRef = useRef(scores);
  scoresRef.current = scores;

  /**
   * Сохраняет попытку экзамена в историю: и при нормальном завершении
   * (completed=true), и при досрочном выходе (completed=false, но с
   * тем, что успел ответить) — раньше прогресс при выходе посередине
   * просто исчезал молча. Читает scoresRef, а не scores напрямую,
   * потому что вызывается из cleanup-эффекта с пустым deps-массивом,
   * где обычное замыкание держало бы устаревший пустой массив.
   */
  function persistAttempt(completed: boolean) {
    if (savedRef.current || items.length === 0) return;
    const answered = scoresRef.current.filter((s): s is number => s !== null);
    if (answered.length === 0 && !completed) return; // ничего не отвечено — нечего сохранять
    savedRef.current = true;
    const scoreRatio = answered.length ? answered.reduce((a, b) => a + b, 0) / items.length : 0;
    saveExamAttempt({
      format: questionCount,
      totalItems: items.length,
      answeredItems: answered.length,
      scoreRatio,
      completed,
      startedAt: startedAtRef.current,
      finishedAt: Date.now(),
    });
  }

  useEffect(() => {
    // Сохраняем незавершённую попытку, если компонент размонтировался
    // не через штатное завершение (например, кнопка "выйти" уже вызвала
    // persistAttempt сама — тут срабатывает только как страховка на
    // случай смены вкладки/сворачивания SPA-роута).
    return () => persistAttempt(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (finished) return;
    if (secondsLeft <= 0) {
      setFinished(true);
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, finished]);

  useEffect(() => {
    if (finished) persistAttempt(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  function handleExit() {
    persistAttempt(false);
    onExit();
  }

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
    const correct = optionIndex === q.correctIndex;
    setScores((prev) => {
      const next = [...prev];
      next[index] = correct ? 1 : 0;
      return next;
    });
    recordQuestionResult(q.id, correct);
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
        <button onClick={handleExit} aria-label="Выйти" className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container">
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
