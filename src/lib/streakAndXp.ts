const LS_STREAK = 'uziprep.streak';
const LS_XP = 'uziprep.xp'; // { [stationId]: number }

interface StreakData {
  count: number;
  lastActiveDay: string; // YYYY-MM-DD
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

/**
 * Вызывается один раз за сессию (например, при заходе в приложение).
 * Если сегодня уже отмечено — просто возвращает текущее состояние.
 * Если был перерыв больше 1 дня — серия сбрасывается на 1 (не на 0,
 * сегодняшний заход уже засчитан).
 */
export function touchStreak(): StreakData {
  const today = todayKey();
  let data: StreakData;
  try {
    data = JSON.parse(localStorage.getItem(LS_STREAK) ?? '') as StreakData;
  } catch {
    data = { count: 0, lastActiveDay: '' };
  }
  if (data.lastActiveDay === today) return data;

  const gap = data.lastActiveDay ? daysBetween(data.lastActiveDay, today) : Infinity;
  const nextCount = gap === 1 ? data.count + 1 : 1;
  const next: StreakData = { count: nextCount, lastActiveDay: today };
  localStorage.setItem(LS_STREAK, JSON.stringify(next));
  return next;
}

export function getStreak(): StreakData {
  try {
    return JSON.parse(localStorage.getItem(LS_STREAK) ?? '') as StreakData;
  } catch {
    return { count: 0, lastActiveDay: '' };
  }
}

/**
 * XP — намеренно простая модель, не претендует на баланс "настоящей"
 * игры: чек-лист пункт = 1, идеальный ordering блока = 5, полностью
 * пройденный сценарий без ошибок = +20 бонус. Достаточно, чтобы дать
 * ощущение прогресса станции, а не как самоцель.
 */
export function addXp(stationId: string, amount: number) {
  const all = getAllXp();
  all[stationId] = (all[stationId] ?? 0) + amount;
  localStorage.setItem(LS_XP, JSON.stringify(all));
}

export function getAllXp(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(LS_XP) ?? '{}');
  } catch {
    return {};
  }
}

export function getStationXp(stationId: string): number {
  return getAllXp()[stationId] ?? 0;
}

const LEVEL_THRESHOLDS = [0, 30, 80, 160, 300, 500];
const LEVEL_LABELS = ['Новичок', 'Ученик', 'Уверенно', 'Почти готов', 'Готов к экзамену', 'Мастер'];

export function levelForXp(xp: number): { level: number; label: string; nextThreshold: number | null } {
  let level = 0;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i;
      break;
    }
  }
  const nextThreshold = level + 1 < LEVEL_THRESHOLDS.length ? LEVEL_THRESHOLDS[level + 1] : null;
  return { level, label: LEVEL_LABELS[level], nextThreshold };
}
