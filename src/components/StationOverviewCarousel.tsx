import { useRef, useState } from 'react';
import type { StationScenario } from '@/types/station';
import { compareSteps } from '@/lib/scenarioComparison';
import { boldFirstWord } from '@/lib/textDisplay';
import { Icon } from '@/components/Icon';

interface Props {
  scenarios: StationScenario[];
}

/**
 * "Обзор" станции: общая рамка (начало/конец — почти всегда одинаковые
 * у всех сценариев) зафиксирована сверху свёрнутым спойлером, а ниже —
 * карусель-свайп по различиям каждого сценария, по одной карточке на
 * экран (как сторис), с точками-индикаторами снизу.
 *
 * Для станций с одним сценарием (нет с чем сравнивать) карусель
 * листает блоки алгоритма (Начало → Работа → Завершение) — тот же
 * визуальный паттерн используется для беглого обзора/ориентирования,
 * а не только для сравнения различий.
 */
export function StationOverviewCarousel({ scenarios }: Props) {
  const hasMultiple = scenarios.length > 1;
  const { common, perScenario } = compareSteps(scenarios);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const cards = hasMultiple
    ? perScenario.map((sc) => ({ title: sc.name, items: sc.unique }))
    : scenarios[0].stepBlocks.map((b) => ({ title: b.block, items: b.items }));

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.clientWidth;
    const idx = Math.round(el.scrollLeft / cardWidth);
    setActiveIndex(Math.max(0, Math.min(cards.length - 1, idx)));
  }

  function scrollTo(i: number) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  }

  return (
    <div>
      {hasMultiple && (
        <details className="mb-4 rounded-m3-md bg-primary-container/40">
          <summary className="cursor-pointer list-none px-3.5 py-3 text-sm font-semibold text-primary">
            <span className="mr-1.5 inline-block [details[open]_&]:rotate-90">›</span>
            Общее для всех сценариев ({common.length})
          </summary>
          <div className="px-3.5 pb-3">
            {common.map((step) => (
              <div key={step.num} className="flex gap-2.5 border-t border-outline-variant/50 py-2 first:border-none">
                <span className="w-6 shrink-0 text-xs text-on-surface-variant">{step.num}</span>
                <p className="text-sm leading-relaxed">{boldFirstWord(step.text)}</p>
              </div>
            ))}
          </div>
        </details>
      )}

      <p className="mb-2 text-xs text-on-surface-variant">
        {hasMultiple ? 'Пролистай — только то, чем отличается каждый сценарий' : 'Пролистай блоки алгоритма'}
      </p>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2"
        style={{ scrollbarWidth: 'none' }}
      >
        {cards.map((card, i) => (
          <div key={i} className="w-full shrink-0 snap-center rounded-m3-md bg-surface-container-low p-4">
            <h2 className="mb-3 text-base font-semibold text-primary">{card.title}</h2>
            {card.items.length === 0 ? (
              <p className="text-sm text-on-surface-variant">Отличий нет — этот сценарий целиком совпадает с общей рамкой</p>
            ) : (
              card.items.map((step) => (
                <div key={step.num} className="flex gap-2.5 border-b border-outline-variant py-2 last:border-none">
                  <span className="w-6 shrink-0 text-xs text-on-surface-variant">{step.num}</span>
                  <p className="text-sm leading-relaxed">{boldFirstWord(step.text)}</p>
                </div>
              ))
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-center gap-2">
        <button onClick={() => scrollTo(Math.max(0, activeIndex - 1))} disabled={activeIndex === 0} aria-label="Предыдущий" className="disabled:opacity-30">
          <Icon name="arrow_back" size={16} />
        </button>
        {cards.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollTo(i)}
            aria-label={`Карточка ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${i === activeIndex ? 'w-5 bg-primary' : 'w-1.5 bg-outline-variant'}`}
          />
        ))}
        <button onClick={() => scrollTo(Math.min(cards.length - 1, activeIndex + 1))} disabled={activeIndex === cards.length - 1} aria-label="Следующий" className="disabled:opacity-30">
          <Icon name="arrow_forward" size={16} />
        </button>
      </div>
    </div>
  );
}
