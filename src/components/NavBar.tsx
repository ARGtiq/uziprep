import { Icon, type IconName } from '@/components/Icon';

export type Tab = 'stations' | 'exam' | 'ai' | 'profile';

const ITEMS: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'stations', label: 'Станции', icon: 'grid_view' },
  { id: 'exam', label: 'Экзамен', icon: 'timer' },
  { id: 'ai', label: 'AI-репетитор', icon: 'auto_awesome' },
  { id: 'profile', label: 'Профиль', icon: 'account_circle' },
];

interface Props {
  active: Tab;
  onChange: (t: Tab) => void;
  variant: 'rail' | 'bottom';
}

export function NavBar({ active, onChange, variant }: Props) {
  if (variant === 'rail') {
    return (
      <nav className="hidden w-24 shrink-0 flex-col gap-1 border-r border-outline-variant p-3 md:flex">
        {ITEMS.map((it) => (
          <button
            key={it.id}
            onClick={() => onChange(it.id)}
            className={`flex flex-col items-center gap-1 rounded-m3-md py-2 text-xs ${
              active === it.id ? 'font-semibold text-on-surface' : 'text-on-surface-variant'
            }`}
          >
            <span
              className={`flex h-8 w-14 items-center justify-center rounded-full ${
                active === it.id ? 'bg-primary-container text-on-primary-container' : ''
              }`}
            >
              <Icon name={it.icon} size={20} strokeWidth={active === it.id ? 2.4 : 2} />
            </span>
            {it.label}
          </button>
        ))}
      </nav>
    );
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex max-w-[1100px] justify-around border-t border-outline-variant bg-surface-container-low px-0 pb-2.5 pt-2 md:hidden">
      {ITEMS.map((it) => (
        <button key={it.id} onClick={() => onChange(it.id)} className="flex flex-1 min-w-0 flex-col items-center gap-0.5">
          <span
            className={`flex h-[28px] w-[52px] items-center justify-center rounded-full ${
              active === it.id ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant'
            }`}
          >
            <Icon name={it.icon} size={20} strokeWidth={active === it.id ? 2.4 : 2} />
          </span>
          <span className={`w-full truncate px-0.5 text-center text-[11px] ${active === it.id ? 'font-semibold text-on-surface' : 'text-on-surface-variant'}`}>
            {it.label}
          </span>
        </button>
      ))}
    </nav>
  );
}
