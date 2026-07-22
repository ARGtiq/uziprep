import { STATIONS } from '@/data/stations';
import type { StepBlock } from '@/types/station';

/** Ищет реальное содержимое блока (карточки для тренировки) по идентификаторам из BlockMastery/NextAction. */
export function findBlockContent(stationId: string, scenarioName: string, blockName: string): StepBlock | null {
  const station = STATIONS.find((s) => s.id === stationId);
  if (!station?.scenarios) return null;
  const scenario = station.scenarios.find((s) => s.name === scenarioName) ?? station.scenarios[0];
  return scenario.stepBlocks.find((b) => b.block === blockName) ?? null;
}
