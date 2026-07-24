import sonogramMap from '@/data/sonogramMap.json';

export interface SonogramEntry {
  file: string;
  stepNums: number[];
}

/**
 * Сонограммы (эталонные УЗ-картины, которые должен видеть/узнавать
 * аккредитуемый) — извлечены из презентации с чек-листами станции,
 * сопоставлены с номерами шагов паспорта (offset -4 — в презентации
 * нумерация начинается с 15, а "Работа с аппаратом" в наших данных
 * начинается с num=11, "Начало" везде ровно 10 пунктов).
 *
 * Сопоставление раздела презентации → конкретный сценарий станции
 * идёт ПО ПОРЯДКУ (раздел 1→сценарий[0] и т.д.) — совпадает со
 * структурным порядком (смещение нумерации подтверждено на всех 8
 * сценариях), но какая именно картинка на какой картинке орган —
 * визуально не проверено на 100%, стоит перепроверить глазами.
 */
const SCENARIO_KEYS: Record<string, string[]> = {
  abdomen: ['liver', 'pancreas', 'right-kidney', 'left-kidney'],
  echo: ['plax', 'psax-aortic', 'psax-lv', 'apical-4ch'],
};

export function hasSonograms(stationId: string): boolean {
  return stationId in SCENARIO_KEYS;
}

export function getSonogramsForBlock(stationId: string, scenarioIndex: number, blockStepNums: number[]): SonogramEntry[] {
  const keys = SCENARIO_KEYS[stationId];
  if (!keys || !keys[scenarioIndex]) return [];
  const mapKey = `${stationId}::${keys[scenarioIndex]}`;
  const entries = (sonogramMap as Record<string, SonogramEntry[]>)[mapKey] ?? [];
  const blockSet = new Set(blockStepNums);
  return entries.filter((e) => e.stepNums.some((n) => blockSet.has(n)));
}

export function sonogramUrl(stationId: string, scenarioIndex: number, file: string): string {
  const keys = SCENARIO_KEYS[stationId];
  const key = keys?.[scenarioIndex] ?? '';
  return `sonograms/${stationId}/${key}/${file}`;
}
