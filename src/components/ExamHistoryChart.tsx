import type { ExamAttempt } from '@/lib/db';

interface Props {
  attempts: ExamAttempt[]; // ожидается уже отсортированным по finishedAt (старые -> новые)
}

/**
 * Простой SVG-спарклайн без внешней библиотеки графиков — 10-20 точек
 * не оправдывают подключение chart.js/recharts ради одного виджета.
 */
export function ExamHistoryChart({ attempts }: Props) {
  if (attempts.length < 2) return null;

  const width = 100;
  const height = 40;
  const points = attempts.map((a, i) => {
    const x = (i / (attempts.length - 1)) * width;
    const y = height - a.scoreRatio * height;
    return { x, y };
  });
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const last = attempts[attempts.length - 1];
  const first = attempts[0];
  const trendUp = last.scoreRatio >= first.scoreRatio;

  return (
    <div className="mb-4 rounded-m3-md bg-surface-container-low p-3.5">
      <div className="mb-2 flex items-center justify-between text-xs text-on-surface-variant">
        <span>Динамика результатов</span>
        <span className={trendUp ? 'text-primary' : 'text-error'}>
          {trendUp ? '↑' : '↓'} {Math.round(first.scoreRatio * 100)}% → {Math.round(last.scoreRatio * 100)}%
        </span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="h-16 w-full">
        <polyline points={`0,${height} ${width},${height}`} stroke="rgb(var(--m3-outline-variant))" strokeWidth={0.5} fill="none" />
        <path d={path} fill="none" stroke="rgb(var(--m3-primary))" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={1.2} fill="rgb(var(--m3-primary))" />
        ))}
      </svg>
    </div>
  );
}
