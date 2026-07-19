import { useEffect, useState } from 'react';
import { Icon } from '@/components/Icon';

/**
 * Простая проверка "есть ли активный service worker, контролирующий
 * эту страницу" — прокси для "контент закэширован и готов к офлайну".
 * Не вызывает useRegisterSW() повторно (это уже сделано в UpdateBanner),
 * чтобы не создавать вторую независимую регистрацию SW.
 */
export function OfflineReadyIndicator() {
  const [ready, setReady] = useState(
    () => typeof navigator !== 'undefined' && !!navigator.serviceWorker?.controller,
  );

  useEffect(() => {
    if (ready || typeof navigator === 'undefined' || !navigator.serviceWorker) return;
    const onControllerChange = () => setReady(!!navigator.serviceWorker.controller);
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    navigator.serviceWorker.ready.then(() => setReady(!!navigator.serviceWorker.controller)).catch(() => {});
    return () => navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
  }, [ready]);

  if (!ready) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-on-surface-variant">
        <Icon name="schedule" size={14} />
        Контент кэшируется для офлайн-режима...
      </p>
    );
  }

  return (
    <p className="flex items-center gap-1.5 text-xs text-primary">
      <Icon name="check_circle" size={14} />
      Весь контент закэширован — работает офлайн
    </p>
  );
}
