import type { StepBlock } from '@/types/station';

/**
 * Некоторые станции (в основном БСЛР) дробятся паспортом на 9-10
 * мелких блоков — в режимах "По блокам"/"Без права на ошибку" это
 * означает 9-10 отдельных мини-раундов подряд, утомительно. Сводим к
 * targetCount более крупным группам, объединяя последовательные блоки.
 * "Всё целиком" эту функцию не использует — там уже намеренно один
 * сплошной список без всякого деления.
 */
export function mergeBlocksToTarget(blocks: StepBlock[], targetCount = 4): StepBlock[] {
  if (blocks.length <= targetCount) return blocks;
  const perGroup = Math.ceil(blocks.length / targetCount);
  const merged: StepBlock[] = [];
  for (let i = 0; i < blocks.length; i += perGroup) {
    const group = blocks.slice(i, i + perGroup);
    merged.push({
      block: group.map((g) => g.block).join(' + '),
      items: group.flatMap((g) => g.items),
    });
  }
  return merged;
}
