import type { ChecklistBlock, StationScenario, StepItem } from '@/types/station';

export interface StepComparison {
  common: StepItem[];
  perScenario: { name: string; unique: StepItem[] }[];
}

export interface ChecklistComparison {
  common: ChecklistBlock[];
  perScenario: { name: string; blocks: ChecklistBlock[] }[];
}

/**
 * Шаг считается общим, если его точный текст встречается во всех
 * сценариях станции — независимо от блока. Номер пункта сохраняется
 * из паспорта того сценария, где шаг впервые встретился (для общих
 * шагов номер обычно совпадает у всех, т.к. блоки "Начало"/"Завершение"
 * идут в одном и том же месте последовательности).
 */
export function compareSteps(scenarios: StationScenario[]): StepComparison {
  if (scenarios.length < 2) {
    return { common: [], perScenario: scenarios.map((s) => ({ name: s.name, unique: flattenSteps(s) })) };
  }
  const textSets = scenarios.map((s) => new Set(flattenSteps(s).map((i) => i.text)));
  const firstFlat = flattenSteps(scenarios[0]);
  const common = firstFlat.filter((item) => textSets.every((set) => set.has(item.text)));
  const commonTextSet = new Set(common.map((i) => i.text));
  const perScenario = scenarios.map((s) => ({
    name: s.name,
    unique: flattenSteps(s).filter((item) => !commonTextSet.has(item.text)),
  }));
  return { common, perScenario };
}

function flattenSteps(scenario: StationScenario): StepItem[] {
  return scenario.stepBlocks.flatMap((b) => b.items);
}

export function compareChecklist(scenarios: StationScenario[]): ChecklistComparison {
  if (scenarios.length < 2) {
    return { common: [], perScenario: scenarios.map((s) => ({ name: s.name, blocks: s.checklist })) };
  }
  const itemSets = scenarios.map((s) => new Set(s.checklist.flatMap((b) => b.items)));
  const isCommon = (item: string) => itemSets.every((set) => set.has(item));

  const common: ChecklistBlock[] = [];
  for (const block of scenarios[0].checklist) {
    const items = block.items.filter(isCommon);
    if (items.length) common.push({ block: block.block, items });
  }

  const perScenario = scenarios.map((s) => {
    const blocks: ChecklistBlock[] = [];
    for (const block of s.checklist) {
      const items = block.items.filter((item) => !isCommon(item));
      if (items.length) blocks.push({ block: block.block, items });
    }
    return { name: s.name, blocks };
  });

  return { common, perScenario };
}

/**
 * Максимальная длина ordering-задания в ТАЙМИРОВАННОМ экзамене.
 * Подобрано из расчёта ~15–20 сек на карточку (перетащить + осмыслить),
 * чтобы одно задание не съедало непропорциональную долю бюджета времени
 * даже в "Быстрой проверке" (5 минут). Полная верcия без ограничения
 * всегда доступна в "Тренировка порядка без таймера" — там время не
 * ограничено, урезать нечего.
 */
export const MAX_EXAM_ORDERING_STEPS = 20;

export function getExamOrderingSteps(station: { steps: string[]; scenarios?: StationScenario[] }): string[] | null {
  if (station.scenarios && station.scenarios.length > 1) {
    const { common } = compareSteps(station.scenarios);
    const texts = common.map((i) => i.text);
    return texts.length > 0 && texts.length <= MAX_EXAM_ORDERING_STEPS ? texts : null;
  }
  return station.steps.length <= MAX_EXAM_ORDERING_STEPS ? station.steps : null;
}
