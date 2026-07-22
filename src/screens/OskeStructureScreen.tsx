import { STATIONS } from '@/data/stations';
import { OSKE_CATEGORIES } from '@/data/oskeStructure';
import { Icon } from '@/components/Icon';

interface Props {
  onBack: () => void;
}

/**
 * 7 смысловых категорий по всем 6 станциям — не дословный текст, а
 * "из чего вообще состоит станция ОСКЭ". Ориентировочный материал,
 * смотрится один раз в начале подготовки, не для ежедневной зубрёжки.
 */
export function OskeStructureScreen({ onBack }: Props) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-2.5">
        <button onClick={onBack} aria-label="Назад" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container">
          <Icon name="arrow_back" size={18} />
        </button>
        <h1 className="text-xl font-semibold">Как устроен ОСКЭ</h1>
      </div>

      <p className="mb-4 text-sm text-on-surface-variant">
        Не дословный текст, а общая форма: из каких типовых элементов состоит станция вообще, независимо от темы.
        Посмотри один раз для ориентировки — это не то, что нужно заучивать.
      </p>

      <div className="flex flex-col gap-2.5">
        {OSKE_CATEGORIES.map((cat) => (
          <div key={cat.label} className="rounded-m3-md bg-surface-container-low p-3.5">
            <b className="text-sm">{cat.label}</b>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {STATIONS.map((s) => {
                const has = cat.stationIds.includes(s.id);
                return (
                  <span
                    key={s.id}
                    className={`rounded-full px-2 py-0.5 text-[11px] ${has ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container text-on-surface-variant opacity-40'}`}
                  >
                    {s.title.length > 16 ? s.title.slice(0, 16) + '…' : s.title}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
