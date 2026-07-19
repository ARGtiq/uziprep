import Dexie, { type Table } from 'dexie';
import type { StationProgress } from '@/types/station';
import type { ChatMessage } from '@/lib/aiClient';
import type { BlockMastery } from '@/lib/mastery';

interface SyncQueueItem {
  id?: number;
  stationId: string;
  createdAt: number;
  synced: 0 | 1;
}

export interface ChatThreadMessage extends ChatMessage {
  id?: number;
  threadKey: string; // stationId или 'general'
  createdAt: number;
}

export interface ExamAttempt {
  id?: number;
  format: number; // 10/20/40
  totalItems: number;
  answeredItems: number;
  scoreRatio: number; // 0..1
  completed: boolean; // false = вышел посередине
  startedAt: number;
  finishedAt: number;
  synced: 0 | 1;
}

export class UziPrepDB extends Dexie {
  progress!: Table<StationProgress, string>;
  syncQueue!: Table<SyncQueueItem, number>;
  chatMessages!: Table<ChatThreadMessage, number>;
  examAttempts!: Table<ExamAttempt, number>;
  blockMastery!: Table<BlockMastery, string>;

  constructor() {
    super('uziprep');
    this.version(1).stores({
      progress: 'stationId',
      syncQueue: '++id, synced',
    });
    this.version(2).stores({
      progress: 'stationId',
      syncQueue: '++id, synced',
      chatMessages: '++id, threadKey, createdAt',
      examAttempts: '++id, synced, finishedAt',
    });
    this.version(3).stores({
      progress: 'stationId',
      syncQueue: '++id, synced',
      chatMessages: '++id, threadKey, createdAt',
      examAttempts: '++id, synced, finishedAt',
      blockMastery: 'key, stationId, dueAt, level',
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

export async function getThreadMessages(threadKey: string): Promise<ChatThreadMessage[]> {
  return db.chatMessages.where('threadKey').equals(threadKey).sortBy('createdAt');
}

export async function appendThreadMessage(threadKey: string, message: ChatMessage) {
  await db.chatMessages.add({ ...message, threadKey, createdAt: Date.now() });
}

export async function clearThread(threadKey: string) {
  await db.chatMessages.where('threadKey').equals(threadKey).delete();
}

export async function saveExamAttempt(attempt: Omit<ExamAttempt, 'id' | 'synced'>) {
  await db.examAttempts.add({ ...attempt, synced: 0 });
}

export async function listExamAttempts(limit = 10): Promise<ExamAttempt[]> {
  return db.examAttempts.orderBy('finishedAt').reverse().limit(limit).toArray();
}
