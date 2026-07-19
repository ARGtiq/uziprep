import { db } from '@/lib/db';
import { bumpLocalUpdatedAt } from '@/lib/localState';

/**
 * Упрощённый SM-2: для каждого блока станции (не отдельного пункта —
 * блок это разумная единица дозирования, 5-25 шагов) храним
 * "уровень уверенности" 0-5 и дату следующего повтора. Правильный
 * проход блока (без ошибок) поднимает уровень и отодвигает повтор
 * экспоненциально дальше; ошибка — откатывает почти к нулю и просит
 * повторить уже завтра.
 */
export interface BlockMastery {
  key: string; // `${stationId}::${scenarioName}::${blockName}`
  stationId: string;
  scenarioName: string;
  blockName: string;
  level: number; // 0..5
  dueAt: number; // timestamp, когда блок пора повторить снова
  lastResult: 'success' | 'fail' | null;
  updatedAt: number;
}

const INTERVALS_DAYS = [0, 1, 3, 7, 14, 30]; // индекс = level

export function masteryKey(stationId: string, scenarioName: string, blockName: string): string {
  return `${stationId}::${scenarioName}::${blockName}`;
}

export async function getBlockMastery(stationId: string, scenarioName: string, blockName: string): Promise<BlockMastery> {
  const key = masteryKey(stationId, scenarioName, blockName);
  const existing = await db.blockMastery.get(key);
  return existing ?? { key, stationId, scenarioName, blockName, level: 0, dueAt: 0, lastResult: null, updatedAt: 0 };
}

export async function recordBlockResult(
  stationId: string,
  scenarioName: string,
  blockName: string,
  success: boolean,
): Promise<BlockMastery> {
  const current = await getBlockMastery(stationId, scenarioName, blockName);
  const nextLevel = success ? Math.min(5, current.level + 1) : Math.max(0, current.level - 2);
  const days = INTERVALS_DAYS[nextLevel];
  const next: BlockMastery = {
    ...current,
    level: nextLevel,
    dueAt: Date.now() + days * 24 * 60 * 60 * 1000,
    lastResult: success ? 'success' : 'fail',
    updatedAt: Date.now(),
  };
  await db.blockMastery.put(next);
  bumpLocalUpdatedAt();
  return next;
}

export async function listWeakBlocks(limit = 10): Promise<BlockMastery[]> {
  const all = await db.blockMastery.toArray();
  return all
    .filter((b) => b.lastResult === 'fail' || b.level <= 2)
    .sort((a, b) => a.level - b.level || a.updatedAt - b.updatedAt)
    .slice(0, limit);
}

export async function listDueBlocks(): Promise<BlockMastery[]> {
  const all = await db.blockMastery.toArray();
  const now = Date.now();
  return all.filter((b) => b.dueAt <= now);
}
