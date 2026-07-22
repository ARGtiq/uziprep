/**
 * ~80% "рабочих" пунктов УЗИ-станций (не начало/конец, а сама суть —
 * сканирование) укладываются в 12 глаголов-действий трёх смысловых
 * групп. Подсветка группы вместо случайного жирного первого слова —
 * так глаз при обычном чтении сам начинает узнавать паттерн "опять
 * измерение" / "опять визуализация", а не воспринимает текст как
 * сплошной поток разных предложений.
 */
export type VerbCategory = 'measure' | 'visualize' | 'evaluate';

const VERB_CATEGORY: Record<string, VerbCategory> = {
  Измерить: 'measure',
  Рассчитать: 'measure',
  Вывести: 'visualize',
  Показать: 'visualize',
  Зафиксировать: 'visualize',
  Провести: 'visualize',
  Получить: 'visualize',
  Найти: 'visualize',
  Расположить: 'visualize',
  Установить: 'visualize',
  Оценить: 'evaluate',
  Определить: 'evaluate',
  Сравнить: 'evaluate',
};

export const CATEGORY_COLOR: Record<VerbCategory, string> = {
  measure: '#2F80ED', // синий — измерение/расчёт
  visualize: '#17A398', // бирюзовый — визуализация/позиционирование
  evaluate: '#9B51E0', // фиолетовый — оценка/сравнение
};

/** Первое слово шага, если это один из 12 известных глаголов-действий — иначе null (не размечаем случайные слова). */
export function detectActionVerb(text: string): { verb: string; category: VerbCategory } | null {
  const spaceIdx = text.indexOf(' ');
  const firstWord = spaceIdx === -1 ? text : text.slice(0, spaceIdx);
  const category = VERB_CATEGORY[firstWord];
  return category ? { verb: firstWord, category } : null;
}

export const CATEGORY_LABEL: Record<VerbCategory, string> = {
  measure: 'измерение',
  visualize: 'визуализация',
  evaluate: 'оценка',
};

/** Считает, сколько пунктов блока попадают в каждую из 3 групп действия — для свёрнутой легенды-подсказки над блоком. */
export function summarizeBlockVerbs(texts: string[]): { category: VerbCategory; count: number }[] {
  const counts: Record<VerbCategory, number> = { measure: 0, visualize: 0, evaluate: 0 };
  for (const t of texts) {
    const detected = detectActionVerb(t);
    if (detected) counts[detected.category]++;
  }
  return (Object.keys(counts) as VerbCategory[]).map((c) => ({ category: c, count: counts[c] })).filter((c) => c.count > 0);
}
