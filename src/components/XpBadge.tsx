import { getAllXp, levelForXp } from '@/lib/streakAndXp';
import { Icon } from '@/components/Icon';

/** Суммарный XP по всем станциям + текущий уровень — общий виджет для главной и экзамена. */
export function XpBadge() {
  const totalXp = Object.values(getAllXp()).reduce((a, b) => a + b, 0);
  const { label } = levelForXp(totalXp);
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-primary-container px-3 py-1.5 text-xs font-semibold text-on-primary-container">
      <Icon name="workspace_premium" size={14} />
      {label} · {totalXp} XP
    </div>
  );
}
