import { useState } from 'react';
import { askAiTutorOnce } from '@/lib/aiClient';
import { isAiConfigured } from '@/lib/aiSettings';
import { Icon } from '@/components/Icon';

interface Props {
  stationTitle: string;
  stepText: string;
  prevStep?: string;
  nextStep?: string;
}

/**
 * "Почему именно так?" — объясняет логику шага, а не просто порядок.
 * Тренировки в приложении учат ПОСЛЕДОВАТЕЛЬНОСТИ, но не пониманию
 * причины — а осмысленное объяснение запоминается надёжнее голого
 * заучивания порядка (elaborative interrogation).
 */
export function WhyThisStepButton({ stationTitle, stepText, prevStep, nextStep }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const configured = isAiConfigured();

  async function ask() {
    setExpanded(true);
    if (answer) return; // уже спрашивали — не дублируем запрос
    setLoading(true);
    setError(null);
    try {
      const context = [prevStep && `Предыдущий шаг: ${prevStep}`, nextStep && `Следующий шаг: ${nextStep}`].filter(Boolean).join('\n');
      const prompt =
        `Станция ОСКЭ: "${stationTitle}". Шаг алгоритма: "${stepText}".${context ? `\n${context}` : ''}\n\n` +
        `Кратко (2-4 предложения) объясни, ПОЧЕМУ этот шаг выполняется именно на этом месте в последовательности ` +
        `и что будет, если его пропустить или переставить — не пересказывай сам шаг, а объясни логику.`;
      const reply = await askAiTutorOnce(prompt);
      setAnswer(reply);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось получить объяснение');
    } finally {
      setLoading(false);
    }
  }

  if (!configured) return null;

  return (
    <div className="mt-1">
      <button onClick={ask} className="flex items-center gap-1 text-xs text-primary">
        <Icon name="auto_awesome" size={12} />
        {loading ? 'Думаю...' : 'Почему именно так?'}
      </button>
      {expanded && answer && <p className="mt-1.5 rounded-m3-md bg-secondary-container p-2.5 text-xs leading-relaxed text-on-secondary-container">{answer}</p>}
      {expanded && error && <p className="mt-1.5 text-xs text-error">{error}</p>}
    </div>
  );
}
