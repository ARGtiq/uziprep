import Dexie, { type Table } from 'dexie';
import type { StationProgress } from '@/types/station';

interface SyncQueueItem {
  id?: number;
  table: string;
  payload: unknown;
  createdAt: number;
  synced: boolean;
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

export async function saveProgress(progress: StationProgress) {
  await db.progress.put(progress);
  await db.syncQueue.add({ table: 'progress', payload: progress, createdAt: Date.now(), synced: false });
}

export async function getProgress(stationId: string): Promise<StationProgress> {
  const existing = await db.progress.get(stationId);
  return existing ?? { stationId, checklistDone: {} };
}
