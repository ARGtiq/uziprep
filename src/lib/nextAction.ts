import { db } from '@/lib/db';
import { listDueBlocks } from '@/lib/mastery';
import { getWrongQuestionIds } from '@/lib/questionStats';
import { getStreak } from '@/lib/streakAndXp';

export type NextActionKind = 'due-block' | 'wrong-questions' | 'streak-risk' | 'start-fresh' | 'keep-going';

export interface NextAction {
  kind: NextActionKind;
  title: string;
  subtitle: string;
  stationId?: string;
}

/**
 * Одна умная рекомендация вместо трёх разрозненных виджетов (слабые
 * места / сегодня повторить / стрик) — приоритет: просроченные блоки
 * mastery > накопленные ошибки в вопросах > риск потерять серию >
 * "начни с чего-то" для новых пользователей > нейтральное "продолжай".
 */
export async function getNextAction(): Promise<NextAction> {
  const dueBlocks = await listDueBlocks();
  if (dueBlocks.length > 0) {
    const first = dueBlocks[0];
    return {
      kind: 'due-block',
      title: `Пора повторить: ${first.blockName}`,
      subtitle: dueBlocks.length > 1 ? `Ещё ${dueBlocks.length - 1} блоков просрочено` : 'Один блок ждёт повторения',
      stationId: first.stationId,
    };
  }

  const wrongIds = await getWrongQuestionIds();
  if (wrongIds.size >= 3) {
    return {
      kind: 'wrong-questions',
      title: `${wrongIds.size} вопросов с ошибками`,
      subtitle: 'Пройди режим "Ошибки" в Экзамене, пока не забыл',
    };
  }

  const streak = getStreak();
  const today = new Date().toISOString().slice(0, 10);
  if (streak.count > 0 && streak.lastActiveDay !== today) {
    return {
      kind: 'streak-risk',
      title: `Не теряй серию: ${streak.count} ${streak.count === 1 ? 'день' : 'дня'}`,
      subtitle: 'Сегодня ещё не тренировался — заходи в любую станцию',
    };
  }

  const progressCount = await db.progress.count();
  if (progressCount === 0) {
    return {
      kind: 'start-fresh',
      title: 'Начни с первой станции',
      subtitle: 'Открой любую и пройди вкладку "Полный план"',
    };
  }

  return {
    kind: 'keep-going',
    title: 'Всё по графику',
    subtitle: 'Можешь попрактиковаться в любом режиме — просроченного нет',
  };
}
