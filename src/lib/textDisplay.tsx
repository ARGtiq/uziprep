import type { ReactNode } from 'react';

/** Жирным — первое слово шага (обычно глагол-действие: "Сесть", "Взять", "Обработать") — облегчает беглое сканирование списка. */
export function boldFirstWord(text: string): ReactNode {
  const spaceIdx = text.indexOf(' ');
  if (spaceIdx === -1) return text;
  return (
    <>
      <b>{text.slice(0, spaceIdx)}</b>
      {text.slice(spaceIdx)}
    </>
  );
}
