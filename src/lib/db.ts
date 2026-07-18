import Dexie, { type Table } from 'dexie';
import type { StationProgress } from '@/types/station';

interface SyncQueueItem {
  id?: number;
  stationId: string;
  createdAt: number;
  synced: 0 | 1;
}

export class UziPrepDB extends Dexie {
  progress!: Table<StationProgress, string>;
  syncQueue!: Table<SyncQueueItem, number>;

  constructor() {
    super('uziprep');
    this.version(1).stores({
      progress: 'stationId',
      syncQueue: '++id, synced',
    });
  }
}

export const db = new UziPrepDB();

/**
 * Сохраняет прогресс локально всегда (офлайн-первый подход) и кладёт
 * запись в очередь на отправку в Supabase. Патч мержится с уже
 * сохранёнными полями — вызывающий код может передавать частичные
 * изменения (например, только checklistDone).
 */
export async function saveProgress(patch: Partial<StationProgress> & { stationId: string }) {
  const existing = await db.progress.get(patch.stationId);
  const next: StationProgress = {
    stationId: patch.stationId,
    checklistDone: patch.checklistDone ?? existing?.checklistDone ?? {},
    orderingBestScore:
      patch.orderingBestScore !== undefined
        ? Math.max(patch.orderingBestScore, existing?.orderingBestScore ?? 0)
        : existing?.orderingBestScore,
    lastPracticedAt: patch.lastPracticedAt ?? existing?.lastPracticedAt,
    updatedAt: Date.now(),
  };
  await db.progress.put(next);
  await db.syncQueue.add({ stationId: patch.stationId, createdAt: Date.now(), synced: 0 });
  return next;
}

export async function getProgress(stationId: string): Promise<StationProgress> {
  const existing = await db.progress.get(stationId);
  return existing ?? { stationId, checklistDone: {}, updatedAt: 0 };
}
