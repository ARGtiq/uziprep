import { useState } from 'react';
import type { StepBlock } from '@/types/station';
import { recordBlockResult } from '@/lib/mastery';
import { addXp } from '@/lib/streakAndXp';
import { Confetti } from '@/components/Confetti';
import { SingleBlockOrdering, type SingleBlockResult } from '@/components/SingleBlockOrdering';
import { Icon } from '@/components/Icon';

interface Props {
  stationId: string;
  scenarioName: string;
  blocks: StepBlock[];
}

type RunState = 'playing' | 'failed' | 'won';

/**
 * Жёсткий режим: одна ошибка в ЛЮБОМ блоке — весь прогон проваливается
 * целиком, без права на "Дальше". Хочешь пройти — начинай с блока 1
 * заново. Подходит как предэкзаменационный стресс-тест, не как
 * основной способ разучивания (для этого есть обычный аккордеон).
 */
export function ZeroMistakeChallenge({ stationId, scenarioName, blocks }: Props) {
  const [blockIndex, setBlockIndex] = useState(0);
  const [runState, setRunState] = useState<RunState>('playing');
  const [runId, setRunId] = useState(0); // меняется при рестарте, чтобы сбросить SingleBlockOrdering
  const [showConfetti, setShowConfetti] = useState(false);
  const [failedAtBlock, setFailedAtBlock] = useState<string | null>(null);

  const block = blocks[blockIndex];
  const isLastBlock = blockIndex === blocks.length - 1;

  function handleChecked(result: SingleBlockResult) {
    if (result.mistakes > 0) {
      recordBlockResult(stationId, scenarioName, block.block, false);
      setFailedAtBlock(block.block);
      setRunState('failed');
      return;
    }
    recordBlockResult(stationId, scenarioName, block.block, true);
    if (isLastBlock) {
      addXp(stationId, 40); // солидный бонус за прохождение всей станции без единой ошибки
      setShowConfetti(true);
      setRunState('won');
    }
  }

  function advance() {
    if (!isLastBlock) setBlockIndex((i) => i + 1);
  }

  function restart() {
    setBlockIndex(0);
    setRunState('playing');
    setFailedAtBlock(null);
    setRunId((n) => n + 1);
  }

  if (runState === 'failed') {
    return (
      <div className="py-6 text-center">
        <Icon name="cancel" size={44} className="mx-auto text-error" />
        <h2 className="mt-3 text-lg font-semibold">Челлендж провален</h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          Ошибка в блоке «{failedAtBlock}» — прогон начинается заново с первого блока.
        </p>
        <button onClick={restart} className="mt-4 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary">
          Начать заново
        </button>
      </div>
    );
  }

  if (runState === 'won') {
    return (
      <div className="py-6 text-center">
        {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
        <Icon name="workspace_premium" size={44} className="mx-auto text-primary" />
        <h2 className="mt-3 text-lg font-semibold">Идеально — вся станция без единой ошибки!</h2>
        <p className="mt-1 text-sm text-on-surface-variant">+40 XP за чистый прогон</p>
        <button onClick={restart} className="mt-4 rounded-full border border-outline-variant px-5 py-2.5 text-sm font-semibold">
          Пройти ещё раз
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-error">
          <Icon name="emergency" size={16} />
          Без права на ошибку
        </div>
        <span className="text-xs text-on-surface-variant">
          Блок {blockIndex + 1} / {blocks.length}
        </span>
      </div>
      <h3 className="mb-3 text-sm font-semibold">{block.block}</h3>

      <SingleBlockOrdering
        key={`${runId}-${blockIndex}`}
        block={block}
        resetKey={`${runId}-${scenarioName}::${block.block}`}
        onChecked={handleChecked}
        showAdvanceControls={!isLastBlock}
        onAdvance={advance}
        advanceLabel="Следующий блок →"
      />
    </div>
  );
}
