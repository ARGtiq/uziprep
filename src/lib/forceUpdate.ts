/**
 * Жёсткий сброс service worker + всех кэшей + переход по URL.
 *
 * История багов: сначала полагались на штатный updateServiceWorker(),
 * он "висел". Добавили fallback через getRegistrations()/caches.keys()
 * с await — оказалось, эти промисы тоже могут не резолвиться в
 * некоторых окружениях (наблюдали на практике: кнопка "Обновляю..."
 * висела бесконечно). Вывод: НИЧЕМУ из этих API нельзя доверять
 * безусловное разрешение промиса.
 *
 * Текущий подход: каждый шаг очистки оборачивается в гонку с коротким
 * таймаутом (withTimeout) — если API не ответил вовремя, просто идём
 * дальше. Финальный переход по URL происходит СИНХРОННО и БЕЗУСЛОВНО
 * в самом конце, что бы ни случилось на шагах очистки — переход не
 * может зависнуть, потому что не зависит ни от одного из них.
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([promise, new Promise<null>((resolve) => setTimeout(() => resolve(null), ms))]);
}

export async function forceHardUpdate() {
  try {
    const registrations = await withTimeout(navigator.serviceWorker.getRegistrations(), 800);
    if (registrations) {
      await withTimeout(Promise.all(registrations.map((r) => r.unregister())), 800);
    }
  } catch {
    // игнорируем
  }
  try {
    const keys = await withTimeout(caches.keys(), 800);
    if (keys) {
      await withTimeout(Promise.all(keys.map((k) => caches.delete(k))), 800);
    }
  } catch {
    // игнорируем
  }

  const url = new URL(window.location.href);
  url.searchParams.set('_refresh', String(Date.now()));
  window.location.href = url.toString();
}
