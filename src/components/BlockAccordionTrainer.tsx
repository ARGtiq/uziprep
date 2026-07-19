import { useMemo, useState } from 'react';
import type { StepBlock, StepItem } from '@/types/station';
import { recordBlockResult } from '@/lib/mastery';
import { addXp } from '@/lib/streakAndXp';
import { Confetti } from '@/components/Confetti';
import { Icon } from '@/components/Icon';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface BlockState {
  cards: StepItem[];
  checked: boolean;
  mistakes: number;
}

function makeBlockState(block: StepBlock): BlockState {
  return { cards: shuffle(block.items), checked: false, mistakes: 0 };
}

interface Props {
  stationId: string;
  scenarioName: string;
  blocks: StepBlock[];
}

/**
 * Идём по блокам паспорта последовательно (без отдельного этапа
 * "разложи по корзинам" — блоки уже даны). Каждый блок — свой мини-
 * ordering на 5-25 карточек вместо одного гигантского списка. Результат
 * каждого блока (без ошибок / с ошибками) пишется в mastery — так
 * дозревают именно слабые блоки, а не станция целиком.
 */
export function BlockAccordionTrainer({ stationId, scenarioName, blocks }: Props) {
  const [blockIndex, setBlockIndex] = useState(0);
  const [state, setState] = useState<BlockState>(() => makeBlockState(blocks[0]));
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [perfectBlocks, setPerfectBlocks] = useState(0);

  const block = blocks[blockIndex];
  const isLastBlock = blockIndex === blocks.length - 1;

  function handleDragStart(num: string) {
    setDragKey(num);
  }
  function handleDropOn(targetNum: string) {
    if (!dragKey || dragKey === targetNum) return;
    setState((prev) => {
      const cards = [...prev.cards];
      const from = cards.findIndex((c) => c.num === dragKey);
      const to = cards.findIndex((c) => c.num === targetNum);
      const [moved] = cards.splice(from, 1);
      cards.splice(to, 0, moved);
      return { ...prev, cards };
    });
    setDragKey(null);
  }
  function moveCard(index: number, dir: -1 | 1) {
    setState((prev) => {
      const cards = [...prev.cards];
      const target = index + dir;
      if (target < 0 || target >= cards.length) return prev;
      [cards[index], cards[target]] = [cards[target], cards[index]];
      return { ...prev, cards };
    });
  }

  function check() {
    const correctOrder = block.items.map((i) => i.num);
    const mistakes = state.cards.filter((c, i) => c.num !== correctOrder[i]).length;
    setState((prev) => ({ ...prev, checked: true, mistakes }));
    recordBlockResult(stationId, scenarioName, block.block, mistakes === 0);
    addXp(stationId, mistakes === 0 ? 5 : 1);
    if (mistakes === 0) {
      setPerfectBlocks((n) => n + 1);
      setShowConfetti(true);
    }
  }

  function next() {
    if (isLastBlock) return;
    const nextIndex = blockIndex + 1;
    setBlockIndex(nextIndex);
    setState(makeBlockState(blocks[nextIndex]));
  }

  const correctOrder = useMemo(() => block.items.map((i) => i.num), [block]);

  if (isLastBlock && state.checked) {
    return (
      <div className="py-6 text-center">
        {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
        <Icon name="workspace_premium" size={44} className="mx-auto text-primary" />
        <h2 className="mt-3 text-lg font-semibold">Все блоки пройдены</h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          Без ошибок: {perfectBlocks} из {blocks.length} блоков
        </p>
      </div>
    );
  }

  return (
    <div>
      {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{block.block}</h3>
        <span className="text-xs text-on-surface-variant">
          Блок {blockIndex + 1} / {blocks.length}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {state.cards.map((card, i) => {
          const isCorrect = state.checked && card.num === correctOrder[i];
          const isWrong = state.checked && card.num !== correctOrder[i];
          return (
            <div
              key={card.num}
              draggable={!state.checked}
              onDragStart={() => handleDragStart(card.num)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDropOn(card.num)}
              className={[
                'flex items-center gap-2.5 rounded-m3-md border p-3 text-sm',
                state.checked
                  ? isCorrect
                    ? 'border-transparent bg-primary-container'
                    : 'border-error bg-error/10'
                  : 'border-transparent bg-surface-container-low cursor-grab active:cursor-grabbing',
              ].join(' ')}
            >
              <Icon name="drag_indicator" size={16} className="shrink-0 text-on-surface-variant" />
              <p className="flex-1">{card.text}</p>
              {!state.checked && (
                <div className="flex flex-col md:hidden">
                  <button onClick={() => moveCard(i, -1)} aria-label="Выше">
                    <Icon name="keyboard_arrow_up" size={16} />
                  </button>
                  <button onClick={() => moveCard(i, 1)} aria-label="Ниже">
                    <Icon name="keyboard_arrow_down" size={16} />
                  </button>
                </div>
              )}
              {isWrong && <Icon name="cancel" size={16} className="text-error" />}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex gap-3">
        {!state.checked ? (
          <button onClick={check} className="flex-1 rounded-full bg-primary py-2.5 text-sm font-semibold text-on-primary">
            Проверить блок
          </button>
        ) : (
          <button onClick={next} className="flex-1 rounded-full bg-primary py-2.5 text-sm font-semibold text-on-primary">
            {state.mistakes === 0 ? 'Отлично — дальше' : 'Дальше'}
          </button>
        )}
      </div>
      {state.checked && (
        <p className="mt-2 text-center text-xs text-on-surface-variant">
          {state.mistakes === 0 ? 'Блок собран без ошибок' : `Ошибок: ${state.mistakes} из ${block.items.length}`}
        </p>
      )}
    </div>
  );
}
