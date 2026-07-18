import { useOnlineStatus } from '@/lib/useOnlineStatus';
import { Icon } from '@/components/Icon';

/**
 * Показывается поверх контента, когда пропала сеть. Прогресс по
 * станциям и чек-листам продолжает работать (Dexie локальный), но
 * синк с Supabase и AI-репетитор в офлайне бессмысленны — баннер
 * явно объясняет это, а не даёт экранам зависать на сетевых запросах.
 */
export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div className="fixed left-0 right-0 top-0 z-[60] mx-auto flex max-w-[1100px] items-center gap-2 bg-error px-4 py-2 text-sm font-medium text-white">
      <Icon name="cancel" size={16} />
      Нет соединения с сетью — станции и чек-листы доступны офлайн, синхронизация и AI приостановлены.
    </div>
  );
}
