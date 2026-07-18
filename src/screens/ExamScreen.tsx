import { useState } from 'react';
import { STATIONS } from '@/data/stations';
import { StepOrderingGame } from '@/components/StepOrderingGame';
import { McqExam } from '@/components/McqExam';

type ExamMode = 'menu' | 'ordering-pick' | 'ordering-play' | 'mcq';

const FORMATS = [
  { count: 10, seconds: 5 * 60, label: 'Быстрая проверка', sub: '10 вопросов · 5 минут' },
  { count: 20, seconds: 10 * 60, label: 'Стандартный экзамен', sub: '20 вопросов · 10 минут' },
  { count: 40, seconds: 25 * 60, label: 'Полный экзамен', sub: '40 вопросов · 25 минут' },
];

export function ExamScreen() {
  const [mode, setMode] = useState<ExamMode>('menu');
  const [stationId, setStationId] = useState<string | null>(null);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [format, setFormat] = useState<(typeof FORMATS)[number]>(FORMATS[1]);

  const orderableStations = STATIONS.filter((s) => s.steps.length >= 3);
  const availableQuestions = STATIONS.flatMap((s) => s.quiz ?? []).length;

  if (mode === 'mcq') {
    return <McqExam questionCount={format.count} secondsPerRun={format.seconds} onExit={() => setMode('menu')} />;
  }

  if (mode === 'ordering-pick') {
    return (
      <div>
        <button className="mb-4 flex items-center gap-1 text-sm text-on-surface-variant" onClick={() => setMode('menu')}>
          <span className="msr text-base" aria-hidden="true">arrow_back</span> Назад
        </button>
        <h1 className="text-xl font-semibold mb-1">Выберите станцию</h1>
        <p className="text-sm text-on-surface-variant mb-4">Соберите правильную последовательность действий.</p>
        <div className="flex flex-col gap-2">
          {orderableStations.map((s) => (
            <button
              key={s.id}
              onClick={() => { setStationId(s.id); setLastScore(null); setMode('ordering-play'); }}
              className="flex items-center gap-3 rounded-m3-md bg-surface-container-low p-3 text-left"
            >
              <span className="msr flex h-11 w-11 items-center justify-center rounded-m3-md bg-primary-container text-on-primary-container" aria-hidden="true">
                {s.icon}
              </span>
              <div>
                <div className="text-sm font-semibold">{s.title}</div>
                <div className="text-xs text-on-surface-variant">{s.steps.length} шагов</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (mode === 'ordering-play' && stationId) {
    const station = STATIONS.find((s) => s.id === stationId)!;
    return (
      <div>
        <button className="mb-4 flex items-center gap-1 text-sm text-on-surface-variant" onClick={() => setMode('ordering-pick')}>
          <span className="msr text-base" aria-hidden="true">arrow_back</span> Другая станция
        </button>
        <h1 className="text-xl font-semibold mb-4">{station.title}</h1>
        <StepOrderingGame station={station} onFinish={setLastScore} />
        {lastScore !== null && lastScore === 1 && (
          <p className="mt-3 text-center text-sm font-semibold text-primary">Идеально — весь порядок верный!</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-1">Симуляция экзамена</h1>
      <p className="text-sm text-on-surface-variant mb-5">
        Случайные вопросы из всех станций с таймером и подсчётом баллов, либо тренировка порядка действий.
      </p>

      <h2 className="mb-2 text-sm font-semibold text-on-surface-variant">Выберите формат</h2>
      {FORMATS.map((f) => (
        <button
          key={f.count}
          onClick={() => setFormat(f)}
          className={`mb-2.5 flex w-full items-center gap-3 rounded-m3-md p-3.5 text-left ${
            format.count === f.count ? 'bg-primary-container' : 'bg-surface-container-low'
          }`}
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-m3-md bg-primary text-sm font-bold text-on-primary">
            {f.count}
          </div>
          <div>
            <b className="text-sm">{f.label}</b>
            <div className="text-xs text-on-surface-variant">{f.sub}</div>
          </div>
        </button>
      ))}

      <button
        onClick={() => setMode('mcq')}
        disabled={availableQuestions === 0}
        className="mb-4 w-full rounded-full bg-primary py-3 text-sm font-semibold text-on-primary disabled:opacity-40"
      >
        Начать: {format.label}
      </button>
      {availableQuestions === 0 && (
        <p className="mb-4 text-xs text-on-surface-variant">В базе пока нет вопросов — добавь их в данные станций.</p>
      )}

      <button
        onClick={() => setMode('ordering-pick')}
        className="flex w-full items-center gap-3 rounded-m3-md bg-secondary-container p-3.5 text-left"
      >
        <span className="msr flex h-11 w-11 shrink-0 items-center justify-center rounded-m3-md bg-primary-container text-on-primary-container" aria-hidden="true">
          drag_indicator
        </span>
        <div>
          <b className="text-sm text-on-secondary-container">Собери последовательность</b>
          <div className="text-xs text-on-surface-variant">Перетащите шаги станции в правильном порядке</div>
        </div>
      </button>
    </div>
  );
}
