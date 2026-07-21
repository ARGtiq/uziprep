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
 * "Почему именно так?" — теперь просто маленький значок-вопрос справа
 * от шага, не текстовая кнопка слева. Меньше визуального веса — это
 * вспомогательная опция, а не основной элемент строки. Раскрывшийся
 * ответ занимает всю ширину строки — родитель должен быть flex-wrap,
 * чтобы фрагмент (кнопка + прижатая к ней панель) корректно переносился.
 */
export function WhyThisStepButton({ stationId, stationTitle, blockName, stepNum, stepText, prevStep, nextStep }: Props) {
  const key = `${stationId}::${blockName}::${stepNum}`;
  const [saved, setSaved] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
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

  function toggle() {
    const next = !expanded;
    setExpanded(next);
    if (next && !saved && !loading) ask();
  }

  if (!configured) return null;

  return (
    <>
      <button
        onClick={toggle}
        aria-label="Почему именно так?"
        title="Почему именно так?"
        className="shrink-0 self-start text-on-surface-variant opacity-50 hover:opacity-100"
      >
        <Icon name="help" size={15} />
      </button>

      {expanded && (
        <div className="w-full basis-full rounded-m3-md bg-secondary-container p-2.5 text-xs leading-relaxed text-on-secondary-container">
          {loading && 'Думаю...'}
          {!loading && saved && renderSimpleMarkdown(saved)}
          {!loading && error && <span className="text-error">{error}</span>}
          {!loading && saved && (
            <button onClick={ask} className="mt-1.5 block text-[11px] font-semibold text-primary underline">
              Спросить другой вариант
            </button>
          )}
        </div>
      )}
    </>
  );
}
