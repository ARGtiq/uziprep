import { useEffect, useState } from 'react';
import { askAiTutorOnce } from '@/lib/aiClient';
import { isAiConfigured } from '@/lib/aiSettings';
import { getLatestMnemonic, saveMnemonicVersion } from '@/lib/mnemonics';
import { Icon } from '@/components/Icon';
import { renderSimpleMarkdown } from '@/lib/simpleMarkdown';

interface Props {
  stationId: string;
  stationTitle: string;
  blockName: string;
  itemTexts: string[];
}

/**
 * Просит AI придумать короткую мнемонику/акроним для блока. Каждая
 * генерация сохраняется как НОВАЯ версия (см. lib/mnemonics.ts) — тут
 * показывается только последняя, вся история — на отдельном экране
 * "Мои мнемоники" (там же удаление и редактирование своим промптом).
 * Спрятана под свёрнутый по умолчанию спойлер.
 */
export function MnemonicButton({ stationId, stationTitle, blockName, itemTexts }: Props) {
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const configured = isAiConfigured();

  useEffect(() => {
    getLatestMnemonic(stationId, blockName).then((saved) => setMnemonic(saved?.text ?? null));
  }, [stationId, blockName]);

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
      await saveMnemonicVersion(stationId, stationTitle, blockName, reply);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сгенерировать');
    } finally {
      setLoading(false);
    }
  }

  if (!configured) return null;

  if (mnemonic) {
    return (
      <details className="mb-2">
        <summary className="cursor-pointer list-none text-xs font-semibold text-primary">
          <span className="mr-1 inline-block [details[open]_&]:rotate-90">›</span>
          Мнемоника
        </summary>
        <div className="mt-2 rounded-m3-md bg-secondary-container p-3 text-sm text-on-secondary-container">
          {renderSimpleMarkdown(mnemonic)}
          <button onClick={generate} disabled={loading} className="mt-2 block text-xs font-semibold text-primary underline disabled:opacity-50">
            {loading ? 'Придумываю...' : 'Другой вариант (сохранится отдельно)'}
          </button>
        </div>
      </details>
    );
  }

  return (
    <div className="mb-2">
      <button
        onClick={generate}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-full border border-outline-variant px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
      >
        <Icon name="auto_awesome" size={14} />
        {loading ? 'Придумываю...' : 'Придумать мнемонику'}
      </button>
      {error && <div className="mt-2 text-xs text-error">{error}</div>}
    </div>
  );
}
