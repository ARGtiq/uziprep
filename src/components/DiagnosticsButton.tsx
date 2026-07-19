import { useState } from 'react';
import { Icon } from '@/components/Icon';

type Status = 'idle' | 'checking' | 'ok' | 'error';

interface Props {
  label: string;
  check: () => Promise<void>;
}

/**
 * Универсальная кнопка диагностики — принимает функцию проверки,
 * которая должна выбросить исключение при неудаче. Используется и
 * для AI-провайдеров (реальный тестовый запрос), и для Supabase
 * (простой select), чтобы явно показать "ключ/подключение рабочее",
 * а не гадать по косвенным признакам.
 */
export function DiagnosticsButton({ label, check }: Props) {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string | null>(null);

  async function run() {
    setStatus('checking');
    setMessage(null);
    try {
      await check();
      setStatus('ok');
    } catch (e) {
      setStatus('error');
      setMessage(e instanceof Error ? e.message : 'Ошибка подключения');
    }
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={run}
        disabled={status === 'checking'}
        className="flex items-center gap-1.5 rounded-full border border-outline-variant px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
      >
        <Icon name={status === 'checking' ? 'schedule' : status === 'ok' ? 'check_circle' : status === 'error' ? 'cancel' : 'auto_awesome'} size={14} className={status === 'ok' ? 'text-primary' : status === 'error' ? 'text-error' : undefined} />
        {status === 'checking' ? 'Проверка...' : label}
      </button>
      {status === 'ok' && <p className="mt-1 text-xs text-primary">Подключение работает</p>}
      {status === 'error' && <p className="mt-1 text-xs text-error">{message}</p>}
    </div>
  );
}
