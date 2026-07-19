import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Icon } from '@/components/Icon';
import { forceHardUpdate } from '@/lib/forceUpdate';

/**
 * По умолчанию vite-plugin-pwa (registerType: 'autoUpdate') тихо
 * подменяет service worker в фоне — если вкладка открыта долго,
 * пользователь может пользоваться устаревшей версией и не узнает,
 * что есть новая, пока сам не перезайдёт. Явно показываем баннер и
 * даём применить обновление одной кнопкой.
 *
 * Штатный updateServiceWorker() на практике оказался ненадёжным на
 * GitHub Pages — кнопка "зависала" бесконечно. Больше не полагаемся
 * на него вообще: сразу вызываем forceHardUpdate() (lib/forceUpdate.ts),
 * который сам ограничен по времени на каждом шаге и гарантированно
 * заканчивается переходом по URL, а не зависанием.
 */
export function UpdateBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [updating, setUpdating] = useState(false);
  const { needRefresh } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      // Периодически проверяем наличие новой версии, пока вкладка открыта
      if (!registration) return;
      const interval = setInterval(() => registration.update(), 60 * 60 * 1000);
      return () => clearInterval(interval);
    },
  });

  useEffect(() => {
    if (needRefresh) setDismissed(false);
  }, [needRefresh]);

  if (!needRefresh || dismissed) return null;

  function handleUpdate() {
    setUpdating(true);
    forceHardUpdate();
  }

  return (
    <div className="fixed bottom-20 left-1/2 z-[65] w-[calc(100%-32px)] max-w-sm -translate-x-1/2 rounded-m3-md bg-primary p-3.5 text-on-primary shadow-lg md:bottom-6">
      <div className="flex items-start gap-2.5">
        <Icon name="refresh" size={18} className="mt-0.5 shrink-0" />
        <div className="flex-1">
          <b className="text-sm">Доступно обновление</b>
          <p className="text-xs opacity-90">Новая версия приложения загружена и готова к применению.</p>
        </div>
        <button onClick={() => setDismissed(true)} aria-label="Позже" className="shrink-0 opacity-80">
          <Icon name="close" size={16} />
        </button>
      </div>
      <button
        onClick={handleUpdate}
        disabled={updating}
        className="mt-2.5 w-full rounded-full bg-on-primary py-2 text-sm font-semibold text-primary disabled:opacity-70"
      >
        {updating ? 'Обновляю...' : 'Обновить сейчас'}
      </button>
    </div>
  );
}
