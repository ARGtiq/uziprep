import { useRef, useState } from 'react';
import { STATIONS } from '@/data/stations';
import { UZI_RITUAL_STATIONS } from '@/data/uziRitual';
import { detectActionVerb, CATEGORY_COLOR, CATEGORY_LABEL, type VerbCategory } from '@/lib/actionVerbs';
import { Icon } from '@/components/Icon';

/**
 * Горизонтальный свайп по трём УЗИ-станциям, где КАЖДЫЙ пункт (не
 * только глагол) подсвечен фоном по категории действия — весь экран
 * превращается в "цветовую карту" станции: видно долю измерений,
 * визуализации, оценки одним взглядом, без чтения текста построчно.
 * Показывается "рабочая" часть (без Начало/Завершение — там глаголов
 * почти нет, это общая рамка, уже разобрана в "УЗИ-ритуале").
 */
export function ActionPatternCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const stations = STATIONS.filter((s) => UZI_RITUAL_STATIONS.includes(s.id));
  const cards = stations.map((s) => {
    const scenario = s.scenarios?.[0];
    const workBlocks = (scenario?.stepBlocks ?? []).filter((b) => b.block !== 'Начало' && b.block !== 'Завершение');
    const items = workBlocks.flatMap((b) => b.items);
    const counts: Record<VerbCategory, number> = { measure: 0, visualize: 0, evaluate: 0 };
    for (const item of items) {
      const d = detectActionVerb(item.text);
      if (d) counts[d.category]++;
    }
    return { station: s, items, counts };
  });

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    setActiveIndex(Math.max(0, Math.min(cards.length - 1, idx)));
  }

  function scrollTo(i: number) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  }

  return (
    <div>
      <div ref={scrollRef} onScroll={handleScroll} className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
        {cards.map(({ station, items, counts }) => (
          <div key={station.id} className="w-full shrink-0 snap-center rounded-m3-md bg-surface-container-low p-4">
            <h2 className="mb-1 text-base font-semibold">{station.title}</h2>
            <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-on-surface-variant">
              {(Object.keys(counts) as VerbCategory[])
                .filter((c) => counts[c] > 0)
                .map((c) => (
                  <span key={c} className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: CATEGORY_COLOR[c] }} />
                    {CATEGORY_LABEL[c]} ({counts[c]})
                  </span>
                ))}
            </div>
            <div className="flex flex-col gap-1">
              {items.map((item) => {
                const detected = detectActionVerb(item.text);
                return (
                  <div
                    key={item.num}
                    className="rounded-m3-sm px-2.5 py-2 text-sm leading-snug"
                    style={{ backgroundColor: detected ? `${CATEGORY_COLOR[detected.category]}22` : 'transparent' }}
                  >
                    {item.text}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-center gap-2">
        <button onClick={() => scrollTo(Math.max(0, activeIndex - 1))} disabled={activeIndex === 0} aria-label="Предыдущая станция" className="disabled:opacity-30">
          <Icon name="arrow_back" size={16} />
        </button>
        {cards.map((_, i) => (
          <button key={i} onClick={() => scrollTo(i)} aria-label={`Станция ${i + 1}`} className={`h-1.5 rounded-full transition-all ${i === activeIndex ? 'w-5 bg-primary' : 'w-1.5 bg-outline-variant'}`} />
        ))}
        <button onClick={() => scrollTo(Math.min(cards.length - 1, activeIndex + 1))} disabled={activeIndex === cards.length - 1} aria-label="Следующая станция" className="disabled:opacity-30">
          <Icon name="arrow_forward" size={16} />
        </button>
      </div>
    </div>
  );
}
