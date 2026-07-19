import { useEffect, useState } from 'react';
import type { StepBlock } from '@/types/station';
import { recordBlockResult } from '@/lib/mastery';
import { addXp } from '@/lib/streakAndXp';
import { recordAttemptTime, getBestTime, formatMs, type RecordResult } from '@/lib/bestTimes';
import { Confetti } from '@/components/Confetti';
import { SingleBlockOrdering, type SingleBlockResult } from '@/components/SingleBlockOrdering';
import { Icon } from '@/components/Icon';

interface Props {
  stationId: string;
  scenarioName: string;
  blocks: StepBlock[];
}

/**
 * Идём по блокам паспорта последовательно. Каждый блок — свой мини-
 * ordering, результат пишется в mastery (spaced repetition) и в личный
 * рекорд времени всего прогона (не отдельного блока — "побей своё
 * время" тут про весь набор блоков целиком, это честнее сравнивать).
 */
export function BlockAccordionTrainer({ stationId, scenarioName, blocks }: Props) {
  const [blockIndex, setBlockIndex] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [perfectBlocks, setPerfectBlocks] = useState(0);
  const [startedAt] = useState(() => Date.now());
  const [timeResult, setTimeResult] = useState<RecordResult | null>(null);
  const [bestSoFar, setBestSoFar] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);

  const timeKey = `${stationId}::${scenarioName}::blocks-run`;

  useEffect(() => {
    getBestTime(timeKey).then(setBestSoFar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeKey]);

  const block = blocks[blockIndex];
  const isLastBlock = blockIndex === blocks.length - 1;

  function handleChecked(result: SingleBlockResult) {
    recordBlockResult(stationId, scenarioName, block.block, result.mistakes === 0);
    addXp(stationId, result.mistakes === 0 ? 5 : 1);
    if (result.mistakes === 0) {
      setPerfectBlocks((n) => n + 1);
      setShowConfetti(true);
    }
    if (isLastBlock) {
      const elapsed = Date.now() - startedAt;
      recordAttemptTime(timeKey, elapsed).then(setTimeResult);
      setFinished(true);
    }
  }

  function next() {
    if (!isLastBlock) setBlockIndex((i) => i + 1);
  }

  if (finished) {
    return (
      <div className="py-6 text-center">
        {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
        <Icon name="workspace_premium" size={44} className="mx-auto text-primary" />
        <h2 className="mt-3 text-lg font-semibold">Все блоки пройдены</h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          Без ошибок: {perfectBlocks} из {blocks.length} блоков
        </p>
        {timeResult && (
          <p className="mt-2 text-sm font-semibold text-primary">
            {timeResult.isNewBest ? `Новый личный рекорд: ${formatMs(timeResult.bestMs)}` : `Время: ${formatMs(timeResult.bestMs)} (рекорд: ${formatMs(timeResult.bestMs)})`}
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{block.block}</h3>
        <div className="text-right text-xs text-on-surface-variant">
          <div>
            Блок {blockIndex + 1} / {blocks.length}
          </div>
          {bestSoFar !== null && <div>Рекорд прогона: {formatMs(bestSoFar)}</div>}
        </div>
      </div>

      <SingleBlockOrdering
        block={block}
        resetKey={`${scenarioName}::${block.block}`}
        onChecked={handleChecked}
        showAdvanceControls={!isLastBlock}
        onAdvance={next}
      />
    </div>
  );
}
