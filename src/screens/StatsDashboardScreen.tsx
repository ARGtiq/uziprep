import { useEffect, useState } from 'react';
import { getAggregateStats, type AggregateStats } from '@/lib/statsAggregate';
import { useLiveQuery } from 'dexie-react-hooks';
import { listExamAttempts } from '@/lib/db';
import { ExamHistoryChart } from '@/components/ExamHistoryChart';
import { Icon } from '@/components/Icon';

interface Props {
  onBack: () => void;
}

function StatCard({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-m3-md bg-surface-container-low p-3.5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
        <Icon name={icon} size={18} />
      </span>
      <div>
        <div className="text-lg font-semibold leading-none">{value}</div>
        <div className="text-xs text-on-surface-variant">{label}</div>
      </div>
    </div>
  );
}

export function StatsDashboardScreen({ onBack }: Props) {
  const [stats, setStats] = useState<AggregateStats | null>(null);
  const chartAttempts = useLiveQuery(() => listExamAttempts(20), [], []) ?? [];

  useEffect(() => {
    getAggregateStats().then(setStats);
  }, []);

  return (
    <div>
      <div className="mb-4 flex items-center gap-2.5">
        <button onClick={onBack} aria-label="Назад" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container">
          <Icon name="arrow_back" size={18} />
        </button>
        <h1 className="text-xl font-semibold">Мои успехи</h1>
      </div>

      {!stats ? (
        <p className="text-sm text-on-surface-variant">Загрузка...</p>
      ) : (
        <>
          <div className="mb-4 rounded-m3-md bg-primary-container p-4 text-center">
            <Icon name="workspace_premium" size={32} className="mx-auto text-on-primary-container" />
            <div className="mt-1 text-lg font-semibold text-on-primary-container">{stats.levelLabel}</div>
            <div className="text-sm text-on-primary-container">{stats.totalXp} XP</div>
          </div>

          <div className="mb-2 grid grid-cols-2 gap-2.5">
            <StatCard icon="schedule" label="Дней подряд" value={String(stats.streakDays)} />
            <StatCard icon="check_circle" label="Попыток экзамена" value={String(stats.examAttemptsCount)} />
            <StatCard icon="workspace_premium" label="Средний результат" value={stats.avgScorePercent !== null ? `${stats.avgScorePercent}%` : '—'} />
            <StatCard icon="schedule" label="Часов тренировок" value={String(stats.trainingHours)} />
            <StatCard icon="refresh" label="Вопросов отвечено" value={String(stats.questionsAnswered)} />
            <StatCard icon="cancel" label="Ошибок всего" value={String(stats.questionsWrongTotal)} />
            <StatCard icon="compare" label="Освоено блоков" value={`${stats.masteredBlocksCount} / ${stats.totalBlocksTracked}`} />
            <StatCard icon="auto_awesome" label="Мнемоник сохранено" value={String(stats.mnemonicsCount)} />
          </div>

          {chartAttempts.length > 1 && (
            <div className="mt-4">
              <ExamHistoryChart attempts={[...chartAttempts].reverse()} />
            </div>
          )}

          <p className="mt-2 text-xs text-on-surface-variant">
            "Часов тренировок" — приближённая оценка по длительности попыток экзамена, не точный трекер времени на все виды тренировки.
          </p>
        </>
      )}
    </div>
  );
}
