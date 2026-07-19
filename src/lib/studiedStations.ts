import { db } from '@/lib/db';
import { STATIONS } from '@/data/stations';

/**
 * Станция считается "изученной", если по ней есть хоть какой-то след
 * активности: отмечен пункт чек-листа ИЛИ пройден хотя бы один блок
 * тренировки порядка (есть запись мастерства). Специально не требуем
 * многого — цель фильтра "не гонять то, что вообще не открывал",
 * а не "только полностью выученное".
 */
export async function getStudiedStationIds(): Promise<string[]> {
  const [progressRows, masteryRows] = await Promise.all([db.progress.toArray(), db.blockMastery.toArray()]);

  const started = new Set<string>();
  for (const p of progressRows) {
    if (Object.values(p.checklistDone).some(Boolean)) started.add(p.stationId);
  }
  for (const m of masteryRows) {
    started.add(m.stationId);
  }
  return STATIONS.filter((s) => started.has(s.id)).map((s) => s.id);
}
