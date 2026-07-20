import { useLiveQuery } from 'dexie-react-hooks';
import { db, type SavedMnemonic } from '@/lib/db';
import { Icon } from '@/components/Icon';
import { renderSimpleMarkdown } from '@/lib/simpleMarkdown';

interface Props {
  onBack: () => void;
  onOpenStation: (stationId: string) => void;
}

/** Все сохранённые мнемоники в одном месте, сгруппированные по станции. */
export function MnemonicsScreen({ onBack, onOpenStation }: Props) {
  const all: SavedMnemonic[] = useLiveQuery(() => db.mnemonics.orderBy('updatedAt').reverse().toArray(), [], []) ?? [];

  const grouped = new Map<string, { stationTitle: string; items: SavedMnemonic[] }>();
  for (const m of all) {
    if (!grouped.has(m.stationId)) grouped.set(m.stationId, { stationTitle: m.stationTitle, items: [] });
    grouped.get(m.stationId)!.items.push(m);
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

      {[...grouped.entries()].map(([stationId, { stationTitle, items }]) => (
        <div key={stationId} className="mb-5">
          <button onClick={() => onOpenStation(stationId)} className="mb-2 text-sm font-semibold text-primary">
            {stationTitle} →
          </button>
          {items.map((m) => (
            <div key={m.key} className="mb-2 rounded-m3-md bg-surface-container-low p-3">
              <div className="mb-1 text-xs font-medium text-on-surface-variant">{m.blockName}</div>
              <div className="text-sm leading-relaxed">{renderSimpleMarkdown(m.text)}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
