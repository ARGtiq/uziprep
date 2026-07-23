import type { ReactNode } from 'react';
import { detectActionVerb, CATEGORY_COLOR } from '@/lib/actionVerbs';

/**
 * Первое слово шага — жирным, а если это один из 12 распознанных
 * глаголов-действий (см. lib/actionVerbs.ts) — ещё и цветом по
 * смысловой группе (измерение/визуализация/оценка). Пассивное
 * усиление паттерна при обычном чтении "Полного плана", без легенды
 * и без клика — просто цвет.
 *
 * detectionText — опционально: по какому тексту определять глагол,
 * если он отличается от отображаемого (например, shortenStep уже
 * заменил "Оценить" на метку "Оценка:" — по displayText глагол не
 * найдётся, нужен оригинал).
 */
export function boldFirstWord(displayText: string, detectionText?: string): ReactNode {
  const spaceIdx = displayText.indexOf(' ');
  if (spaceIdx === -1) return displayText;
  const firstWord = displayText.slice(0, spaceIdx);
  const rest = displayText.slice(spaceIdx);
  const detected = detectActionVerb(detectionText ?? displayText);

  return (
    <>
      <b style={detected ? { color: CATEGORY_COLOR[detected.category] } : undefined}>{firstWord}</b>
      {rest}
    </>
  );
}

const VERB_LABEL: Record<string, string | null> = {
  Провести: null, // просто убираем — существительное дальше уже несёт смысл ("Провести сканирование" → "Сканирование")
  Оценить: 'Оценка',
  Определить: 'Определение',
  Измерить: 'Измерение',
  Рассчитать: 'Расчёт',
  Вывести: 'Визуализация',
  Показать: 'Показ',
  Зафиксировать: 'Фиксация',
  Получить: 'Получение',
  Найти: 'Поиск',
  Расположить: 'Расположение',
  Установить: 'Установка',
  Сравнить: 'Сравнение',
};

const FILLER_WORDS = new Set(['обзорное', 'обзорный', 'обзорную', 'области']);

/**
 * Сокращённая формулировка для обзорных/карусельных экранов (не для
 * "Полного плана" станции — там дословный текст паспорта обязателен).
 *
 * Не тупое усечение по словам (первая версия резала на середине мысли
 * и один раз выкинула самую суть шага) — а превращение глагола в
 * метку через двоеточие: "Оценить X" → "Оценка: x", а не "Оценка X"
 * слитно — слитный вариант ломает падеж (нужен родительный, регэкспом
 * его надёжно не получить для произвольной фразы на русском), а метка
 * через двоеточие грамматически нейтральна и понятна без склонения.
 * Плюс убираем технический хвост "в В-режиме"/"в систолу" (он всегда
 * один и тот же внутри блока, повторять его на каждой карточке
 * незачем) и скобочные уточнения.
 */
export function shortenStep(text: string): string {
  let t = text.replace(/\s*\([^)]*\)/g, '');
  t = t.replace(/,?\s+в\s+(В-режиме|режиме допплерографии|режиме цветового допплеровского картирования|систолу|диастолу).*$/i, '');

  const spaceIdx = t.indexOf(' ');
  const verb = spaceIdx === -1 ? t : t.slice(0, spaceIdx);
  let rest = spaceIdx === -1 ? '' : t.slice(spaceIdx + 1);
  rest = rest
    .split(' ')
    .filter((w) => !FILLER_WORDS.has(w.toLowerCase()))
    .join(' ');

  if (!(verb in VERB_LABEL)) return t.trim().replace(/\.$/, '');

  const label = VERB_LABEL[verb];
  const result = label ? `${label}: ${rest ? rest[0].toLowerCase() + rest.slice(1) : ''}` : rest ? rest[0].toUpperCase() + rest.slice(1) : t;
  return result.trim().replace(/\.$/, '');
}
