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
