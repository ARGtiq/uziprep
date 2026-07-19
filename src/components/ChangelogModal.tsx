import { APP_VERSION, CHANGELOG } from '@/version';
import { Icon } from '@/components/Icon';

const LS_LAST_SEEN = 'uziprep.lastSeenVersion';

export function shouldShowChangelog(): boolean {
  const lastSeen = localStorage.getItem(LS_LAST_SEEN);
  return lastSeen !== null && lastSeen !== APP_VERSION; // null = самая первая установка, не показываем "что нового" не на чем
}

export function markChangelogSeen() {
  localStorage.setItem(LS_LAST_SEEN, APP_VERSION);
}

interface Props {
  onClose: () => void;
}

export function ChangelogModal({ onClose }: Props) {
  const latest = CHANGELOG[0];
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 md:items-center">
      <div className="w-full max-w-md rounded-t-m3-lg bg-surface p-5 md:rounded-m3-lg">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-primary">
            <Icon name="workspace_premium" size={16} />
            Что нового в {latest.version}
          </div>
          <button onClick={onClose} aria-label="Закрыть" className="text-on-surface-variant">
            <Icon name="close" size={18} />
          </button>
        </div>
        <ul className="mb-4 list-disc pl-5 text-sm leading-relaxed">
          {latest.items.map((item, i) => (
            <li key={i} className="mb-1">
              {item}
            </li>
          ))}
        </ul>
        <button onClick={onClose} className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-on-primary">
          Понятно
        </button>
      </div>
    </div>
  );
}
