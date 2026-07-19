import { useState } from 'react';
import { askAiTutorOnce } from '@/lib/aiClient';
import { isAiConfigured } from '@/lib/aiSettings';
import { Icon } from '@/components/Icon';

interface Props {
  blockName: string;
  itemTexts: string[];
}

/**
 * Просит AI придумать короткую мнемонику/акроним из первых
 * букв/смысловых опор шагов блока. Результат не сохраняется — это
 * разовая подсказка, при повторном нажатии можно попросить другой
 * вариант (модель не детерминирована).
 */
export function MnemonicButton({ blockName, itemTexts }: Props) {
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const configured = isAiConfigured();

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const prompt =
        `Придумай короткую мнемонику или акроним на русском языке, чтобы запомнить порядок ` +
        `следующих шагов блока "${blockName}" медицинского протокола. Дай 1-2 варианта, кратко, ` +
        `без длинных объяснений:\n\n` +
        itemTexts.map((t, i) => `${i + 1}. ${t}`).join('\n');
      const reply = await askAiTutorOnce(prompt);
      setMnemonic(reply);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сгенерировать');
    } finally {
      setLoading(false);
    }
  }

  if (!configured) return null;

  return (
    <div className="mb-4">
      <button
        onClick={generate}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-full border border-outline-variant px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
      >
        <Icon name="auto_awesome" size={14} />
        {loading ? 'Придумываю...' : mnemonic ? 'Другой вариант' : 'Придумать мнемонику'}
      </button>
      {mnemonic && <div className="mt-2 rounded-m3-md bg-secondary-container p-3 text-sm text-on-secondary-container">{mnemonic}</div>}
      {error && <div className="mt-2 text-xs text-error">{error}</div>}
    </div>
  );
}
