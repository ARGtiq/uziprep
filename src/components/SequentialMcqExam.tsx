import { useEffect, useState } from 'react';
import { STATIONS } from '@/data/stations';
import type { QuizQuestion } from '@/types/station';
import { recordQuestionResult, getWrongQuestionIds } from '@/lib/db';
import { Icon } from '@/components/Icon';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export type SequentialSource = 'all' | 'wrong';

interface Props {
  source: SequentialSource;
  onExit: () => void;
}

/**
 * Последовательный прогон MCQ без таймера — либо весь банк вопросов
 * подряд ("Нон-стоп"), либо только те, где хоть раз ответил неверно
 * ("Ошибки"). В отличие от MixedExam/ExamFeverMode тут нет давления
 * по времени и нет заданий на порядок — чистая проверка знаний в
 * своём темпе, с накоплением статистики по каждому вопросу.
 */
export function SequentialMcqExam({ source, onExit }: Props) {
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);

  useEffect(() => {
    (async () => {
      const all = shuffle(STATIONS.flatMap((s) => s.quiz ?? []));
      if (source === 'all') {
        setQuestions(all);
      } else {
        const wrongIds = await getWrongQuestionIds();
        setQuestions(all.filter((q) => wrongIds.has(q.id)));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  if (questions === null) {
    return <p className="text-sm text-on-surface-variant">Загрузка...</p>;
  }

  if (questions.length === 0) {
    return (
      <div className="py-6 text-center">
        <Icon name="check_circle" size={44} className="mx-auto text-primary" />
        <h2 className="mt-3 text-lg font-semibold">{source === 'wrong' ? 'Ошибок пока нет' : 'В базе пока нет вопросов'}</h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          {source === 'wrong' ? 'Отлично — нечего повторять. Возвращайся сюда после нескольких попыток экзамена.' : ''}
        </p>
        <button onClick={onExit} className="mt-4 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary">
          Назад
        </button>
      </div>
    );
  }

  const q = questions[index];
  const isLast = index === questions.length - 1;
  const done = index >= questions.length;

  async function select(i: number) {
    if (selected !== null) return;
    setSelected(i);
    const correct = i === q.correctIndex;
    if (correct) setCorrectCount((c) => c + 1);
    await recordQuestionResult(q.id, correct);
  }

  function next() {
    setSelected(null);
    setIndex((i) => i + 1);
  }

  if (done) {
    const percent = Math.round((correctCount / questions.length) * 100);
    return (
      <div className="py-6 text-center">
        <Icon name={percent >= 70 ? 'workspace_premium' : 'refresh'} size={44} className="mx-auto text-primary" />
        <h2 className="mt-3 text-lg font-semibold">{percent}%</h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          Верно: {correctCount} из {questions.length}
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
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-container">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(index / questions.length) * 100}%` }} />
        </div>
        <span className="text-xs text-on-surface-variant">
          {index + 1} / {questions.length}
        </span>
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
              {showResult && isCorrectOption && <Icon name="check_circle" size={16} className="ml-2 inline text-primary" />}
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <button onClick={next} className="mt-5 w-full rounded-full bg-primary py-3 text-sm font-semibold text-on-primary">
          {isLast ? 'Завершить' : 'Дальше'}
        </button>
      )}
    </div>
  );
}
