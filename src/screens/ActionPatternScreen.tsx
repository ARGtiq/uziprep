import { ActionPatternCarousel } from '@/components/ActionPatternCarousel';
import { Icon } from '@/components/Icon';

interface Props {
  onBack: () => void;
}

export function ActionPatternScreen({ onBack }: Props) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-2.5">
        <button onClick={onBack} aria-label="Назад" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container">
          <Icon name="arrow_back" size={18} />
        </button>
        <h1 className="text-xl font-semibold">Цветовая карта действий</h1>
      </div>
      <p className="mb-4 text-sm text-on-surface-variant">
        Пролистай — каждый пункт подсвечен целиком по типу действия (измерение / визуализация / оценка), не только глагол. Видно долю каждого типа одним взглядом.
      </p>
      <ActionPatternCarousel />
    </div>
  );
}
