import Dexie, { type Table } from 'dexie';
import { bumpLocalUpdatedAt } from '@/lib/localState';

export interface BestTimeRecord {
  key: string; // например `${stationId}::full` или `${stationId}::${scenario}::${block}`
  bestMs: number;
  updatedAt: number;
}

// Отдельная лёгкая Dexie-таблица вместо расширения основной схемы —
// рекорды времени не требуют версионной миграции остального прогресса
// и логически независимы (можно очистить одно, не трогая другое).
class BestTimesDB extends Dexie {
  bestTimes!: Table<BestTimeRecord, string>;
  constructor() {
    super('uziprep-besttimes');
    this.version(1).stores({ bestTimes: 'key' });
  }
}
const btDb = new BestTimesDB();

export interface RecordResult {
  isNewBest: boolean;
  bestMs: number;
  previousBestMs: number | null;
}

/** Пишет время попытки, только если она успешна (без ошибок) — иначе рекорд не засчитываем. */
export async function recordAttemptTime(key: string, elapsedMs: number): Promise<RecordResult> {
  const existing = await btDb.bestTimes.get(key);
  const previousBestMs = existing?.bestMs ?? null;
  const isNewBest = previousBestMs === null || elapsedMs < previousBestMs;
  if (isNewBest) {
    await btDb.bestTimes.put({ key, bestMs: elapsedMs, updatedAt: Date.now() });
    bumpLocalUpdatedAt();
  }
  return { isNewBest, bestMs: isNewBest ? elapsedMs : previousBestMs!, previousBestMs };
}

export async function getBestTime(key: string): Promise<number | null> {
  const existing = await btDb.bestTimes.get(key);
  return existing?.bestMs ?? null;
}

export function formatMs(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return m > 0 ? `${m}м ${s}с` : `${s}с`;
}
