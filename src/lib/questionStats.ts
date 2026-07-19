import { db, type QuestionStat } from '@/lib/db';
import { bumpLocalUpdatedAt } from '@/lib/localState';

/**
 * Вынесено из db.ts в отдельный модуль намеренно: localState.ts (для
 * bumpLocalUpdatedAt) сам импортирует db.ts, поэтому если бы db.ts
 * импортировал localState.ts обратно — получился бы настоящий
 * рантайм-циклический импорт. Этот файл может безопасно зависеть от
 * обоих, так как ничего не импортирует его самого.
 */
export async function recordQuestionResult(questionId: string, correct: boolean) {
  const existing = await db.questionStats.get(questionId);
  const next: QuestionStat = {
    questionId,
    correctCount: (existing?.correctCount ?? 0) + (correct ? 1 : 0),
    wrongCount: (existing?.wrongCount ?? 0) + (correct ? 0 : 1),
    lastResult: correct ? 'correct' : 'wrong',
    lastSeenAt: Date.now(),
  };
  await db.questionStats.put(next);
  bumpLocalUpdatedAt();
}

export async function getWrongQuestionIds(): Promise<Set<string>> {
  const all = await db.questionStats.where('wrongCount').above(0).toArray();
  return new Set(all.map((s) => s.questionId));
}
