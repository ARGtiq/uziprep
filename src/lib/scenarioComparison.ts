import type { ChecklistBlock, StationScenario } from '@/types/station';

export interface StepComparison {
  common: string[];
  perScenario: { name: string; unique: string[] }[];
}

export interface ChecklistComparison {
  common: ChecklistBlock[];
  perScenario: { name: string; blocks: ChecklistBlock[] }[];
}

/**
 * Шаг считается общим, если его точный текст встречается во всех
 * сценариях станции — независимо от того, в каком блоке он стоит.
 * На практике это совпадает с реальностью паспортов: блоки "Начало"
 * и "Завершение" почти всегда дословно одинаковы для всех сценариев
 * одной станции, а различается только "рабочая" середина (конкретный
 * орган/доступ), даже если у неё то же имя блока.
 */
export function compareSteps(scenarios: StationScenario[]): StepComparison {
  if (scenarios.length < 2) {
    return { common: [], perScenario: scenarios.map((s) => ({ name: s.name, unique: s.steps })) };
  }
  const sets = scenarios.map((s) => new Set(s.steps));
  const common = scenarios[0].steps.filter((step) => sets.every((set) => set.has(step)));
  const commonSet = new Set(common);
  const perScenario = scenarios.map((s) => ({
    name: s.name,
    unique: s.steps.filter((step) => !commonSet.has(step)),
  }));
  return { common, perScenario };
}

/**
 * Та же логика на уровне пунктов чек-листа, но с сохранением
 * группировки по блокам (чтобы "Общие пункты" и "Отличия" по-прежнему
 * читались структурированно, а не единым списком).
 */
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

/**
 * Даёт список шагов для ordering-задания ИМЕННО в контексте экзамена.
 * Для станций с несколькими сценариями сначала пробует "общее ядро"
 * (пересечение всех сценариев, см. compareSteps) — оно заметно короче
 * полного протокола любого отдельного сценария и остаётся честным
 * самодостаточным заданием. Если даже общее ядро длиннее порога —
 * станция целиком исключается из пула экзамена (null).
 */
export function getExamOrderingSteps(station: { steps: string[]; scenarios?: StationScenario[] }): string[] | null {
  if (station.scenarios && station.scenarios.length > 1) {
    const { common } = compareSteps(station.scenarios);
    return common.length > 0 && common.length <= MAX_EXAM_ORDERING_STEPS ? common : null;
  }
  return station.steps.length <= MAX_EXAM_ORDERING_STEPS ? station.steps : null;
}
