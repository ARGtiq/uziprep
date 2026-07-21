import { db, type SavedMnemonic } from '@/lib/db';
import { bumpLocalUpdatedAt } from '@/lib/localState';

/**
 * Каждая генерация — НОВАЯ запись (ключ включает timestamp), а не
 * перезапись предыдущей. Раньше ключ был `${stationId}::${blockName}`
 * и "Другой вариант" тихо стирал прошлый — теперь вся история
 * остаётся, доступна в разделе "Мои мнемоники", удаляется вручную.
 */
export async function saveMnemonicVersion(
  stationId: string,
  stationTitle: string,
  blockName: string,
  text: string,
): Promise<SavedMnemonic> {
  const row: SavedMnemonic = {
    key: `${stationId}::${blockName}::${Date.now()}`,
    stationId,
    stationTitle,
    blockName,
    text,
    updatedAt: Date.now(),
  };
  await db.mnemonics.put(row);
  bumpLocalUpdatedAt();
  return row;
}

/** Последняя (самая свежая) версия мнемоники для блока — для инлайн-показа на странице станции. */
export async function getLatestMnemonic(stationId: string, blockName: string): Promise<SavedMnemonic | null> {
  const rows = await db.mnemonics.where('stationId').equals(stationId).toArray();
  const forBlock = rows.filter((r) => r.blockName === blockName).sort((a, b) => b.updatedAt - a.updatedAt);
  return forBlock[0] ?? null;
}

export async function deleteMnemonic(key: string) {
  await db.mnemonics.delete(key);
  bumpLocalUpdatedAt();
}
