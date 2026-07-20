import { useEffect, useState } from 'react';
import { askAiTutorOnce } from '@/lib/aiClient';
import { isAiConfigured } from '@/lib/aiSettings';
import { db } from '@/lib/db';
import { bumpLocalUpdatedAt } from '@/lib/localState';
import { Icon } from '@/components/Icon';
import { renderSimpleMarkdown } from '@/lib/simpleMarkdown';

interface Props {
  stationId: string;
  stationTitle: string;
  blockName: string;
  stepNum: string;
  stepText: string;
  prevStep?: string;
  nextStep?: string;
}

/**
 * "Почему именно так?" — объясняет логику шага, а не просто порядок.
 * Результат сохраняется в Dexie (как и мнемоники) — при повторном
 * визите сразу виден в свёрнутом спойлере, не нужно спрашивать заново
 * и ждать AI. Спойлер по умолчанию закрыт, чтобы не загромождать
 * список шагов текстом на каждом заходе.
 */
export function WhyThisStepButton({ stationId, stationTitle, blockName, stepNum, stepText, prevStep, nextStep }: Props) {
  const key = `${stationId}::${blockName}::${stepNum}`;
  const [saved, setSaved] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const configured = isAiConfigured();

  useEffect(() => {
    db.whyExplanations.get(key).then((row) => setSaved(row?.text ?? null));
  }, [key]);

  async function ask() {
    setLoading(true);
    setError(null);
    try {
      const context = [prevStep && `Предыдущий шаг: ${prevStep}`, nextStep && `Следующий шаг: ${nextStep}`].filter(Boolean).join('\n');
      const prompt =
        `Станция ОСКЭ: "${stationTitle}". Шаг алгоритма: "${stepText}".${context ? `\n${context}` : ''}\n\n` +
        `Кратко (2-4 предложения) объясни, ПОЧЕМУ этот шаг выполняется именно на этом месте в последовательности ` +
        `и что будет, если его пропустить или переставить — не пересказывай сам шаг, а объясни логику.`;
      const reply = await askAiTutorOnce(prompt);
      setSaved(reply);
      await db.whyExplanations.put({ key, stationId, text: reply, updatedAt: Date.now() });
      bumpLocalUpdatedAt();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось получить объяснение');
    } finally {
      setLoading(false);
    }
  }

  if (!configured) return null;

  if (saved) {
    return (
      <details className="mt-1">
        <summary className="cursor-pointer list-none text-xs text-primary">
          <span className="mr-1 inline-block [details[open]_&]:rotate-90">›</span>
          Почему именно так?
        </summary>
        <div className="mt-1.5 rounded-m3-md bg-secondary-container p-2.5 text-xs leading-relaxed text-on-secondary-container">
          {renderSimpleMarkdown(saved)}
          <button onClick={ask} disabled={loading} className="mt-1.5 block text-[11px] font-semibold text-primary underline disabled:opacity-50">
            {loading ? 'Думаю...' : 'Спросить другой вариант'}
          </button>
        </div>
      </details>
    );
  }

  return (
    <div className="mt-1">
      <button onClick={ask} disabled={loading} className="flex items-center gap-1 text-xs text-primary disabled:opacity-50">
        <Icon name="auto_awesome" size={12} />
        {loading ? 'Думаю...' : 'Почему именно так?'}
      </button>
      {error && <p className="mt-1.5 text-xs text-error">{error}</p>}
    </div>
  );
}
