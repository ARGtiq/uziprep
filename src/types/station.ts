export type StationCategory = 'УЗИ' | 'Неотложная помощь' | 'Общие навыки';

export interface ChecklistBlock {
  block: string;
  items: string[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface Station {
  id: string;
  category: StationCategory;
  title: string;
  icon: string; // Material Symbols glyph name
  timeMinutes: number;
  description: string;
  /** Шаги в правильном порядке — источник и для "Алгоритма", и для drag-n-drop режима */
  steps: string[];
  checklist: ChecklistBlock[];
  quiz?: QuizQuestion[];
}

export interface StationProgress {
  stationId: string;
  checklistDone: Record<string, boolean>; // key = `${block}::${item}`
  orderingBestScore?: number; // 0..1, лучший результат drag-n-drop попытки
  lastPracticedAt?: number;
}
