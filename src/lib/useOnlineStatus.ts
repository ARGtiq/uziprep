import { useEffect, useState } from 'react';

/**
 * Единая точка правды про состояние сети для всего приложения.
 * Используется и баннером офлайна, и экранами, которые делают сетевые
 * запросы (AI-репетитор, Supabase-синк), чтобы не пытаться стучаться
 * в сеть и сразу показывать понятное сообщение вместо зависания на
 * "Печатает..." до таймаута fetch.
 */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return online;
}
