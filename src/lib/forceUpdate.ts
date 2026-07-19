/**
 * Жёсткий сброс service worker + всех кэшей + перезагрузка с
 * cache-busting параметром. Вынесено в отдельный модуль, чтобы
 * использовать и из UpdateBanner (автоматически, когда обнаружено
 * обновление), и из Профиля (вручную, если баннер по какой-то причине
 * не появился, а версия в приложении всё равно старая).
 */
export async function forceHardUpdate() {
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((r) => r.unregister()));
  } catch {
    // игнорируем — всё равно перезагружаемся ниже
  }
  try {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  } catch {
    // игнорируем
  }
  const url = new URL(window.location.href);
  url.searchParams.set('_refresh', String(Date.now()));
  window.location.href = url.toString();
}
