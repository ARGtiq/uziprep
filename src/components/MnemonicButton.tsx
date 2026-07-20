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
  itemTexts: string[];
}

/**
 * Просит AI придумать короткую мнемонику/акроним для блока и
 * сохраняет результат в Dexie (по ключу станция+блок) — при
 * следующем заходе показывается сохранённая, а не теряется.
 * "Другой вариант" перезаписывает сохранённое новой генерацией.
 * Все сохранённые мнемоники доступны разом на отдельном экране
 * (см. screens/MnemonicsScreen.tsx).
 */
export function MnemonicButton({ stationId, stationTitle, blockName, itemTexts }: Props) {
  const key = `${stationId}::${blockName}`;
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const configured = isAiConfigured();

  useEffect(() => {
    db.mnemonics.get(key).then((saved) => setMnemonic(saved?.text ?? null));
  }, [key]);

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
      await db.mnemonics.put({ key, stationId, stationTitle, blockName, text: reply, updatedAt: Date.now() });
      bumpLocalUpdatedAt();
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
      {mnemonic && <div className="mt-2 rounded-m3-md bg-secondary-container p-3 text-sm text-on-secondary-container">{renderSimpleMarkdown(mnemonic)}</div>}
      {error && <div className="mt-2 text-xs text-error">{error}</div>}
    </div>
  );
}
