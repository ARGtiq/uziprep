import type { ReactNode } from 'react';
import { detectActionVerb, CATEGORY_COLOR } from '@/lib/actionVerbs';

/**
 * Первое слово шага — жирным, а если это один из 12 распознанных
 * глаголов-действий (см. lib/actionVerbs.ts) — ещё и цветом по
 * смысловой группе (измерение/визуализация/оценка). Пассивное
 * усиление паттерна при обычном чтении "Полного плана", без легенды
 * и без клика — просто цвет.
 */
export function boldFirstWord(text: string): ReactNode {
  const spaceIdx = text.indexOf(' ');
  if (spaceIdx === -1) return text;
  const firstWord = text.slice(0, spaceIdx);
  const rest = text.slice(spaceIdx);
  const detected = detectActionVerb(text);

  return (
    <>
      <b style={detected ? { color: CATEGORY_COLOR[detected.category] } : undefined}>{firstWord}</b>
      {rest}
    </>
  );
}
