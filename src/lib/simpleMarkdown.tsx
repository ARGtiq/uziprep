import type { ReactNode } from 'react';

/**
 * Минимальный markdown-рендер без внешней зависимости — специально
 * под то, что реально генерируют LLM в коротких ответах: **жирный**,
 * `код`, списки (- / 1.), переносы строк. Не претендует на полный
 * CommonMark — заголовки/таблицы/ссылки не нужны в контексте чат-ответов.
 */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|`(.+?)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    if (match[2] !== undefined) {
      parts.push(<b key={`${keyPrefix}-b-${i++}`}>{match[2]}</b>);
    } else if (match[3] !== undefined) {
      parts.push(
        <code key={`${keyPrefix}-c-${i++}`} className="rounded bg-surface-container px-1 py-0.5 text-[13px]">
          {match[3]}
        </code>,
      );
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

export function renderSimpleMarkdown(markdown: string): ReactNode {
  const lines = markdown.split('\n');
  const blocks: ReactNode[] = [];
  let listBuffer: string[] = [];
  let listOrdered = false;

  function flushList() {
    if (listBuffer.length === 0) return;
    const Tag = listOrdered ? 'ol' : 'ul';
    blocks.push(
      <Tag key={`list-${blocks.length}`} className={listOrdered ? 'list-decimal pl-5' : 'list-disc pl-5'}>
        {listBuffer.map((item, i) => (
          <li key={i} className="mb-0.5">
            {renderInline(item, `li-${blocks.length}-${i}`)}
          </li>
        ))}
      </Tag>,
    );
    listBuffer = [];
  }

  lines.forEach((line, idx) => {
    const bulletMatch = line.match(/^\s*[-*]\s+(.+)$/);
    const numberedMatch = line.match(/^\s*\d+\.\s+(.+)$/);
    if (bulletMatch) {
      if (listOrdered) flushList();
      listOrdered = false;
      listBuffer.push(bulletMatch[1]);
      return;
    }
    if (numberedMatch) {
      if (!listOrdered) flushList();
      listOrdered = true;
      listBuffer.push(numberedMatch[1]);
      return;
    }
    flushList();
    if (line.trim() === '') {
      blocks.push(<div key={`sp-${idx}`} className="h-2" />);
    } else {
      blocks.push(
        <p key={`p-${idx}`} className="mb-1">
          {renderInline(line, `p-${idx}`)}
        </p>,
      );
    }
  });
  flushList();

  return <>{blocks}</>;
}
