import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { STATIONS } from '@/data/stations';
import { StepOrderingGame } from '@/components/StepOrderingGame';
import { MixedExam } from '@/components/MixedExam';
import { ExamFeverMode } from '@/components/ExamFeverMode';
import { Icon } from '@/components/Icon';
import { listExamAttempts } from '@/lib/db';

type ExamMode = 'menu' | 'ordering-pick' | 'ordering-play' | 'mixed' | 'fever';

const FORMATS = [
  { count: 10, seconds: 5 * 60, label: 'Быстрая проверка', sub: '~10 заданий · 5 минут' },
  { count: 20, seconds: 10 * 60, label: 'Стандартный экзамен', sub: '~20 заданий · 10 минут' },
  { count: 40, seconds: 25 * 60, label: 'Полный экзамен', sub: '~40 заданий · 25 минут' },
];

export function ExamScreen() {
  const [mode, setMode] = useState<ExamMode>('menu');
  const [stationId, setStationId] = useState<string | null>(null);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [format, setFormat] = useState<(typeof FORMATS)[number]>(FORMATS[1]);

  const orderableStations = STATIONS.filter((s) => s.steps.length >= 3);
  const availableQuestions = STATIONS.flatMap((s) => s.quiz ?? []).length;
  const canRunMixed = availableQuestions > 0 || orderableStations.length > 0;
  const attempts = useLiveQuery(() => listExamAttempts(5), [], []) ?? [];

  if (mode === 'mixed') {
    return <MixedExam questionCount={format.count} secondsPerRun={format.seconds} onExit={() => setMode('menu')} />;
  }

  if (mode === 'fever') {
    return <ExamFeverMode onExit={() => setMode('menu')} />;
  }

  if (mode === 'ordering-pick') {
    return (
      <div>
        <button className="mb-4 flex items-center gap-1 text-sm text-on-surface-variant" onClick={() => setMode('menu')}>
          <Icon name="arrow_back" size={16} /> Назад
        </button>
        <h1 className="text-xl font-semibold mb-1">Выберите станцию</h1>
        <p className="text-sm text-on-surface-variant mb-4">Соберите правильную последовательность действий, без таймера.</p>
        <div className="flex flex-col gap-2">
          {orderableStations.map((s) => (
            <button
              key={s.id}
              onClick={() => { setStationId(s.id); setLastScore(null); setMode('ordering-play'); }}
              className="flex items-center gap-3 rounded-m3-md bg-surface-container-low p-3 text-left"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-m3-md bg-primary-container text-on-primary-container">
                <Icon name={s.icon as any} size={22} />
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
          <Icon name="arrow_back" size={16} /> Другая станция
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
        Смешанный формат: тестовые вопросы и задания "собери порядок" по всем станциям, с общим таймером.
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
        onClick={() => setMode('mixed')}
        disabled={!canRunMixed}
        className="mb-4 w-full rounded-full bg-primary py-3 text-sm font-semibold text-on-primary disabled:opacity-40"
      >
        Начать: {format.label}
      </button>
      {!canRunMixed && (
        <p className="mb-4 text-xs text-on-surface-variant">В базе пока нет вопросов и станций для экзамена.</p>
      )}

      <button
        onClick={() => setMode('ordering-pick')}
        className="mb-2.5 flex w-full items-center gap-3 rounded-m3-md bg-secondary-container p-3.5 text-left"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-m3-md bg-primary-container text-on-primary-container">
          <Icon name="drag_indicator" size={22} />
        </span>
        <div>
          <b className="text-sm text-on-secondary-container">Тренировка порядка без таймера</b>
          <div className="text-xs text-on-surface-variant">Отдельно потренироваться на одной станции</div>
        </div>
      </button>

      <button
        onClick={() => setMode('fever')}
        disabled={availableQuestions === 0}
        className="flex w-full items-center gap-3 rounded-m3-md bg-error/10 p-3.5 text-left disabled:opacity-40"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-m3-md bg-error/20 text-error">
          <Icon name="emergency" size={22} />
        </span>
        <div>
          <b className="text-sm text-error">Экзаменационная лихорадка</b>
          <div className="text-xs text-on-surface-variant">Серия вопросов с убывающим временем на ответ — до первой ошибки</div>
        </div>
      </button>

      {attempts.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-on-surface-variant">История попыток</h2>
          <div className="flex flex-col gap-1.5">
            {attempts.map((a) => {
              const percent = Math.round(a.scoreRatio * 100);
              const date = new Date(a.finishedAt);
              return (
                <div key={a.id} className="flex items-center gap-3 rounded-m3-md bg-surface-container-low p-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      percent >= 70 ? 'bg-primary-container text-on-primary-container' : 'bg-secondary-container text-on-secondary-container'
                    }`}
                  >
                    {percent}%
                  </div>
                  <div className="min-w-0 flex-1 text-xs text-on-surface-variant">
                    <span className="font-medium text-on-surface">{a.format} заданий</span>
                    {!a.completed && ' · не завершено'} · {a.answeredItems}/{a.totalItems} отвечено ·{' '}
                    {date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
