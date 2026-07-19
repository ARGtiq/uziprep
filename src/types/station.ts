export type StationCategory = 'УЗИ' | 'Неотложная помощь' | 'Общие навыки';

export interface ChecklistBlock {
  block: string;
  items: string[];
}

/** Один пункт алгоритма с исходным номером из паспорта станции. */
export interface StepItem {
  num: string; // "1", "14" и т.д. — как в паспорте, для отображения и как ключ мастерства блока
  text: string;
}

export interface StepBlock {
  block: string;
  items: StepItem[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

/**
 * Реальные станции ОСКЭ часто содержат несколько сценариев (например,
 * УЗИ ОБП — печень / поджелудочная / правая почка / левая почка): общий
 * брифинг станции один, но конкретный орган на исследование определяет
 * АПК в день экзамена. У каждого сценария — свой дословный алгоритм и
 * чек-лист по паспорту станции.
 */
export interface StationScenario {
  name: string;
  /** Плоский список текста шагов — для старого кода (ordering-игра, MCQ-пул) */
  steps: string[];
  /** Та же последовательность, но с сохранением блоков и номеров из паспорта — для аккордеона, мастерства блоков, вкладки "Сравнение" */
  stepBlocks: StepBlock[];
  checklist: ChecklistBlock[];
}

export interface Station {
  id: string;
  category: StationCategory;
  title: string;
  icon: string; // Material Symbols/Lucide glyph name (см. src/components/Icon.tsx)
  timeMinutes: number;
  description: string;
  /**
   * Для станций с несколькими сценариями (scenarios заполнено) —
   * steps/checklist ниже не используются напрямую, это данные первого
   * сценария по умолчанию (для обратной совместимости старых мест кода).
   * Новый код должен читать через getActiveSteps/getActiveChecklist
   * с учётом выбранного сценария (см. src/data/stations.ts).
   */
  steps: string[];
  checklist: ChecklistBlock[];
  scenarios?: StationScenario[];
  quiz?: QuizQuestion[];
}

export interface StationProgress {
  stationId: string;
  checklistDone: Record<string, boolean>; // key = `${block}::${item}`
  orderingBestScore?: number; // 0..1, лучший результат drag-n-drop попытки
  lastPracticedAt?: number;
  updatedAt: number; // timestamp последнего изменения — для разрешения конфликтов sync (last-write-wins)
}
