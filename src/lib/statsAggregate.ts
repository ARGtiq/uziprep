import { db } from '@/lib/db';
import { getStreak, getAllXp, levelForXp } from '@/lib/streakAndXp';

export interface AggregateStats {
  level: number;
  levelLabel: string;
  totalXp: number;
  streakDays: number;
  examAttemptsCount: number;
  avgScorePercent: number | null;
  trainingHours: number; // сумма длительностей попыток экзамена — приближённая оценка, не идеальный трекинг времени
  questionsAnswered: number;
  questionsWrongTotal: number;
  masteredBlocksCount: number; // level >= 3
  totalBlocksTracked: number;
  mnemonicsCount: number;
}

/**
 * Собирает всё, что нужно для дашборда "Мои успехи" в одном месте —
 * умышленно приближённая оценка (например, "часы тренировок" считаем
 * по длительности попыток экзамена, у нас нет точного трекинга времени
 * на ordering-тренировках/чтении алгоритмов), но давать пользователю
 * ощущение прогресса важнее идеальной точности здесь.
 */
export async function getAggregateStats(): Promise<AggregateStats> {
  const [attempts, mastery, questionStats, mnemonics] = await Promise.all([
    db.examAttempts.toArray(),
    db.blockMastery.toArray(),
    db.questionStats.toArray(),
    db.mnemonics.toArray(),
  ]);

  const streak = getStreak();
  const totalXp = Object.values(getAllXp()).reduce((a, b) => a + b, 0);
  const { level, label } = levelForXp(totalXp);

  const avgScorePercent = attempts.length
    ? Math.round((attempts.reduce((sum, a) => sum + a.scoreRatio, 0) / attempts.length) * 100)
    : null;

  const trainingMs = attempts.reduce((sum, a) => sum + Math.max(0, a.finishedAt - a.startedAt), 0);

  const questionsAnswered = questionStats.reduce((sum, q) => sum + q.correctCount + q.wrongCount, 0);
  const questionsWrongTotal = questionStats.reduce((sum, q) => sum + q.wrongCount, 0);
  const masteredBlocksCount = mastery.filter((m) => m.level >= 3).length;

  return {
    level,
    levelLabel: label,
    totalXp,
    streakDays: streak.count,
    examAttemptsCount: attempts.length,
    avgScorePercent,
    trainingHours: Math.round((trainingMs / 3600000) * 10) / 10,
    questionsAnswered,
    questionsWrongTotal,
    masteredBlocksCount,
    totalBlocksTracked: mastery.length,
    mnemonicsCount: mnemonics.length,
  };
}
