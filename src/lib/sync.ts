import { supabase } from '@/lib/supabase';
import { db } from '@/lib/db';
import type { StationProgress } from '@/types/station';

interface RemoteRow {
  station_id: string;
  checklist_done: Record<string, boolean>;
  ordering_best_score: number | null;
  last_practiced_at: number | null;
  updated_at: string;
}

/**
 * Отправляет накопленные локальные изменения (очередь syncQueue) в
 * Supabase. Вызывается после входа и периодически/по событию сохранения,
 * когда есть сеть. Молча завершается, если Supabase не настроен —
 * работа приложения от этого не зависит (см. lib/supabase.ts).
 */
export async function pushLocalChanges(userId: string) {
  if (!supabase) return;
  const pending = await db.syncQueue.where('synced').equals(0).toArray();
  if (pending.length === 0) return;

  const stationIds = [...new Set(pending.map((p) => p.stationId))];
  const rows = await Promise.all(stationIds.map((id) => db.progress.get(id)));

  const payload = rows.filter((r): r is StationProgress => !!r).map((r) => ({
    user_id: userId,
    station_id: r.stationId,
    checklist_done: r.checklistDone,
    ordering_best_score: r.orderingBestScore ?? null,
    last_practiced_at: r.lastPracticedAt ?? null,
    updated_at: new Date(r.updatedAt).toISOString(),
  }));

  const { error } = await supabase.from('progress').upsert(payload, { onConflict: 'user_id,station_id' });
  if (!error) {
    const ids = pending.map((p) => p.id).filter((id): id is number => id !== undefined);
    await db.syncQueue.bulkDelete(ids);
  }
}

/**
 * Тянет прогресс из Supabase и мержит с локальным по правилу
 * last-write-wins (сравнение updatedAt). Вызывается один раз после
 * успешного входа — дальше состояние живёт локально и синкается через
 * pushLocalChanges.
 */
export async function pullRemoteChanges(userId: string) {
  if (!supabase) return;
  const { data, error } = await supabase.from('progress').select('*').eq('user_id', userId);
  if (error || !data) return;

  for (const row of data as RemoteRow[]) {
    const remoteUpdatedAt = new Date(row.updated_at).getTime();
    const local = await db.progress.get(row.station_id);
    if (!local || remoteUpdatedAt > local.updatedAt) {
      await db.progress.put({
        stationId: row.station_id,
        checklistDone: row.checklist_done ?? {},
        orderingBestScore: row.ordering_best_score ?? undefined,
        lastPracticedAt: row.last_practiced_at ?? undefined,
        updatedAt: remoteUpdatedAt,
      });
    }
  }
}

export async function fullSync(userId: string) {
  await pullRemoteChanges(userId);
  await pushLocalChanges(userId);
}
