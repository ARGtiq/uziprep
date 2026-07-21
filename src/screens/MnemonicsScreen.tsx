import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type SavedMnemonic } from '@/lib/db';
import { deleteMnemonic, saveMnemonicVersion } from '@/lib/mnemonics';
import { askAiTutorOnce } from '@/lib/aiClient';
import { Icon } from '@/components/Icon';
import { renderSimpleMarkdown } from '@/lib/simpleMarkdown';

interface Props {
  onBack: () => void;
  onOpenStation: (stationId: string) => void;
}

const LS_OPEN_GROUPS = 'uziprep.mnemonics.openGroups';

function loadOpenGroups(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(LS_OPEN_GROUPS) ?? '{}');
  } catch {
    return {};
  }
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function MnemonicCard({ m }: { m: SavedMnemonic }) {
  const [editing, setEditing] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function applyEdit() {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const fullPrompt =
        `Вот текущая мнемоника для блока "${m.blockName}":\n"${m.text}"\n\n` +
        `Измени её по такой инструкции пользователя: "${prompt.trim()}"\n\n` +
        `Дай только итоговый результат, без пояснений от себя.`;
      const reply = await askAiTutorOnce(fullPrompt);
      // Новая версия — не перезаписывает эту карточку, а добавляется отдельной записью в ту же группу
      await saveMnemonicVersion(m.stationId, m.stationTitle, m.blockName, reply);
      setEditing(false);
      setPrompt('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось отредактировать');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-2 rounded-m3-md bg-surface-container-low p-3">
      <div className="mb-1 flex items-center justify-between">
        <div className="text-xs font-medium text-on-surface-variant">{formatDate(m.updatedAt)}</div>
        <button onClick={() => deleteMnemonic(m.key)} aria-label="Удалить" className="text-on-surface-variant opacity-50 hover:text-error hover:opacity-100">
          <Icon name="cancel" size={15} />
        </button>
      </div>
      <div className="text-sm leading-relaxed">{renderSimpleMarkdown(m.text)}</div>

      {!editing ? (
        <button onClick={() => setEditing(true)} className="mt-2 flex items-center gap-1 text-xs font-semibold text-primary">
          <Icon name="auto_awesome" size={12} />
          Редактировать с AI
        </button>
      ) : (
        <div className="mt-2">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Как изменить? Например: «сделай короче» или «привяжи к первым буквам по-другому»"
            rows={2}
            className="mb-2 w-full rounded-m3-sm border border-outline-variant bg-surface px-2.5 py-1.5 text-xs"
          />
          <div className="flex gap-2">
            <button
              onClick={applyEdit}
              disabled={loading || !prompt.trim()}
              className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-on-primary disabled:opacity-40"
            >
              {loading ? 'Применяю...' : 'Применить (сохранится отдельно)'}
            </button>
            <button onClick={() => setEditing(false)} className="rounded-full border border-outline-variant px-3 py-1.5 text-xs font-semibold">
              Отмена
            </button>
          </div>
          {error && <p className="mt-1.5 text-xs text-error">{error}</p>}
        </div>
      )}
    </div>
  );
}

/**
 * Все сохранённые мнемоники, сгруппированные по станции → блоку.
 * Ничего не удаляется автоматически при генерации новой версии (см.
 * lib/mnemonics.ts) — вся история видна тут, чистка только вручную.
 * Заголовки станций — спойлеры, состояние (открыт/закрыт) запоминается
 * между визитами через localStorage.
 */
export function MnemonicsScreen({ onBack, onOpenStation }: Props) {
  const all: SavedMnemonic[] = useLiveQuery(() => db.mnemonics.orderBy('updatedAt').reverse().toArray(), [], []) ?? [];
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(loadOpenGroups);

  function toggleGroup(stationId: string) {
    setOpenGroups((prev) => {
      const next = { ...prev, [stationId]: !(prev[stationId] ?? true) };
      localStorage.setItem(LS_OPEN_GROUPS, JSON.stringify(next));
      return next;
    });
  }

  const byStation = new Map<string, { stationTitle: string; byBlock: Map<string, SavedMnemonic[]> }>();
  for (const m of all) {
    if (!byStation.has(m.stationId)) byStation.set(m.stationId, { stationTitle: m.stationTitle, byBlock: new Map() });
    const group = byStation.get(m.stationId)!;
    if (!group.byBlock.has(m.blockName)) group.byBlock.set(m.blockName, []);
    group.byBlock.get(m.blockName)!.push(m);
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-2.5">
        <button onClick={onBack} aria-label="Назад" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container">
          <Icon name="arrow_back" size={18} />
        </button>
        <h1 className="text-xl font-semibold">Мои мнемоники</h1>
      </div>

      {all.length === 0 && (
        <p className="text-sm text-on-surface-variant">
          Пока пусто — сгенерируй мнемонику для блока на вкладке "Полный план" любой станции, она появится здесь.
        </p>
      )}

      {[...byStation.entries()].map(([stationId, { stationTitle, byBlock }]) => {
        const isOpen = openGroups[stationId] ?? true;
        const totalCount = [...byBlock.values()].reduce((s, arr) => s + arr.length, 0);
        return (
          <details key={stationId} open={isOpen} className="mb-3 rounded-m3-md bg-primary-container/30">
            <summary
              onClick={(e) => {
                e.preventDefault();
                toggleGroup(stationId);
              }}
              className="flex cursor-pointer items-center justify-between gap-2 rounded-m3-md p-3 text-left"
            >
              <div className="flex items-center gap-2">
                <span className={`inline-block transition-transform ${isOpen ? 'rotate-90' : ''}`}>›</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenStation(stationId);
                  }}
                  className="text-base font-bold text-primary underline-offset-2 hover:underline"
                >
                  {stationTitle}
                </button>
              </div>
              <span className="shrink-0 text-xs text-on-surface-variant">{totalCount}</span>
            </summary>

            {isOpen && (
              <div className="px-3 pb-3">
                {[...byBlock.entries()].map(([blockName, items]) => (
                  <div key={blockName} className="mb-3">
                    <h3 className="mb-1.5 text-sm font-semibold text-on-surface-variant">{blockName}</h3>
                    {items.map((m) => (
                      <MnemonicCard key={m.key} m={m} />
                    ))}
                  </div>
                ))}
              </div>
            )}
          </details>
        );
      })}
    </div>
  );
}
