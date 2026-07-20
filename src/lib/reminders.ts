import { getStreak } from '@/lib/streakAndXp';

const LS_ENABLED = 'uziprep.reminders.enabled';
const LS_TIME = 'uziprep.reminders.time'; // "HH:MM"
const LS_LAST_NOTIFIED = 'uziprep.reminders.lastNotifiedDay'; // YYYY-MM-DD

const DEFAULT_TIME = '19:00';

export function isRemindersEnabled(): boolean {
  return localStorage.getItem(LS_ENABLED) === '1';
}

export function setRemindersEnabled(v: boolean) {
  localStorage.setItem(LS_ENABLED, v ? '1' : '0');
}

export function getReminderTime(): string {
  return localStorage.getItem(LS_TIME) ?? DEFAULT_TIME;
}

export function setReminderTime(hhmm: string) {
  localStorage.setItem(LS_TIME, hhmm);
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * ЧЕСТНОЕ ограничение: без бэкенда с Web Push настоящие фоновые
 * пуш-уведомления (когда вкладка/приложение закрыты) невозможны —
 * для этого нужен сервер, который шлёт push, и это осознанно вне
 * объёма этого проекта (см. README). Эта функция проверяет условие
 * и показывает уведомление, только пока страница открыта — вызывается
 * при заходе в приложение и периодически, пока вкладка активна.
 *
 * Дополнительно (best-effort, не гарантированно) пробуем
 * зарегистрировать Periodic Background Sync — поддерживается только
 * в Chrome на Android для установленных PWA с достаточным "site
 * engagement score", и даже там не даёт точного времени срабатывания.
 * Если API недоступен — тихо игнорируем, это ожидаемо на большинстве
 * платформ (iOS Safari, Firefox и т.д.).
 */
export function checkAndNotify() {
  if (!isRemindersEnabled()) return;
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

  const today = todayKey();
  if (localStorage.getItem(LS_LAST_NOTIFIED) === today) return; // уже показывали сегодня

  const streak = getStreak();
  if (streak.lastActiveDay === today) return; // уже тренировался сегодня — не дёргаем

  const [h, m] = getReminderTime().split(':').map(Number);
  const now = new Date();
  const reminderPassed = now.getHours() > h || (now.getHours() === h && now.getMinutes() >= m);
  if (!reminderPassed) return;

  new Notification('Пора потренироваться', {
    body: 'Сегодня ещё не было тренировки в UziPrep — даже 5 минут лучше, чем ничего.',
    icon: 'icons/icon-192.png',
  });
  localStorage.setItem(LS_LAST_NOTIFIED, today);
}

export async function tryRegisterPeriodicSync(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const reg = registration as ServiceWorkerRegistration & {
      periodicSync?: { register: (tag: string, opts: { minInterval: number }) => Promise<void> };
    };
    if (!reg.periodicSync) return false;
    await reg.periodicSync.register('uziprep-reminder', { minInterval: 12 * 60 * 60 * 1000 });
    return true;
  } catch {
    return false;
  }
}
