import { db } from '@/lib/db';

const LS_UPDATED_AT = 'uziprep.misc.updatedAt';
const LS_LAST_PUSHED_AT = 'uziprep.misc.lastPushedAt';

/**
 * Локальные фичи этого раунда (streak, XP, мастерство блоков, личные
 * рекорды времени) изначально жили только в localStorage/Dexie без
 * связи с Supabase — на другом устройстве весь этот прогресс был
 * не виден. Этот модуль — минимальный мост синхронизации: единая
 * метка времени "последнее локальное изменение" плюс сериализация
 * всех четырёх кусков в один JSON-блоб для отправки в Supabase.
 *
 * bumpLocalUpdatedAt() дёргают все мутирующие функции (addXp,
 * touchStreak, recordBlockResult, recordAttemptTime) — без этого
 * синхронизация не узнает, что стоит отправлять.
 */
export function bumpLocalUpdatedAt() {
  localStorage.setItem(LS_UPDATED_AT, String(Date.now()));
}

export function getLocalUpdatedAt(): number {
  return Number(localStorage.getItem(LS_UPDATED_AT) ?? 0);
}

function getLastPushedAt(): number {
  return Number(localStorage.getItem(LS_LAST_PUSHED_AT) ?? 0);
}

function setLastPushedAt(ts: number) {
  localStorage.setItem(LS_LAST_PUSHED_AT, String(ts));
}

export interface MiscStateBlob {
  streak: unknown;
  xp: unknown;
  mastery: unknown[];
  bestTimes: unknown[];
  questionStats: unknown[];
  mnemonics: unknown[];
  updatedAt: number;
}

export async function exportLocalState(): Promise<MiscStateBlob> {
  const streak = JSON.parse(localStorage.getItem('uziprep.streak') ?? '{}');
  const xp = JSON.parse(localStorage.getItem('uziprep.xp') ?? '{}');
  const mastery = await db.blockMastery.toArray();
  const questionStats = await db.questionStats.toArray();
  const mnemonics = await db.mnemonics.toArray();
  const bestTimes = await getAllBestTimesRaw();
  return { streak, xp, mastery, bestTimes, questionStats, mnemonics, updatedAt: getLocalUpdatedAt() };
}

export async function importLocalState(blob: Omit<MiscStateBlob, 'updatedAt'>) {
  localStorage.setItem('uziprep.streak', JSON.stringify(blob.streak));
  localStorage.setItem('uziprep.xp', JSON.stringify(blob.xp));
  await db.blockMastery.clear();
  if (Array.isArray(blob.mastery) && blob.mastery.length) {
    // @ts-expect-error — форма гарантирована источником (Supabase), не пересобираем типы ради синка
    await db.blockMastery.bulkPut(blob.mastery);
  }
  await db.questionStats.clear();
  if (Array.isArray(blob.questionStats) && blob.questionStats.length) {
    // @ts-expect-error — то же самое
    await db.questionStats.bulkPut(blob.questionStats);
  }
  await db.mnemonics.clear();
  if (Array.isArray(blob.mnemonics) && blob.mnemonics.length) {
    // @ts-expect-error — то же самое
    await db.mnemonics.bulkPut(blob.mnemonics);
  }
  await setAllBestTimesRaw(blob.bestTimes);
}

/**
 * bestTimes живёт в отдельной Dexie-базе (см. lib/bestTimes.ts) —
 * читаем/пишем её напрямую здесь, чтобы не тащить лишний паблик-API
 * в bestTimes.ts только ради синка.
 */
async function getAllBestTimesRaw(): Promise<unknown[]> {
  const Dexie = (await import('dexie')).default;
  const raw = new Dexie('uziprep-besttimes');
  raw.version(1).stores({ bestTimes: 'key' });
  const table = (raw as unknown as { table: (name: string) => { toArray: () => Promise<unknown[]> } }).table('bestTimes');
  const all = await table.toArray();
  raw.close();
  return all;
}

async function setAllBestTimesRaw(items: unknown[]) {
  const Dexie = (await import('dexie')).default;
  const raw = new Dexie('uziprep-besttimes');
  raw.version(1).stores({ bestTimes: 'key' });
  const table = (raw as unknown as { table: (name: string) => { clear: () => Promise<void>; bulkPut: (items: unknown[]) => Promise<unknown> } }).table('bestTimes');
  await table.clear();
  if (items.length) await table.bulkPut(items);
  raw.close();
}

export function markSyncedNow(ts: number) {
  setLastPushedAt(ts);
}

export function hasPendingLocalChanges(): boolean {
  return getLocalUpdatedAt() > getLastPushedAt();
}
