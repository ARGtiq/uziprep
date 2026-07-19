import { describe, it, expect, beforeEach, vi } from 'vitest';

// localStorage мокается вручную — тесты запускаются в node-окружении без DOM
class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

// @ts-expect-error — подменяем глобальный localStorage для теста
globalThis.localStorage = new MemoryStorage();

const { levelForXp, addXp, getStationXp, touchStreak } = await import('@/lib/streakAndXp');

describe('levelForXp', () => {
  it('возвращает "Новичок" при нулевом XP', () => {
    expect(levelForXp(0).label).toBe('Новичок');
  });
  it('поднимает уровень с ростом XP', () => {
    expect(levelForXp(30).label).toBe('Ученик');
    expect(levelForXp(500).label).toBe('Мастер');
  });
});

describe('addXp / getStationXp', () => {
  beforeEach(() => localStorage.clear());
  it('накапливает XP по станции', () => {
    addXp('abdomen', 5);
    addXp('abdomen', 10);
    expect(getStationXp('abdomen')).toBe(15);
  });
});

describe('touchStreak', () => {
  beforeEach(() => localStorage.clear());
  it('засчитывает первый день как серию из 1', () => {
    const s = touchStreak();
    expect(s.count).toBe(1);
  });
  it('повторный вызов в тот же день не увеличивает счётчик', () => {
    touchStreak();
    const s2 = touchStreak();
    expect(s2.count).toBe(1);
  });
  it('сбрасывает серию на 1 после пропуска дня', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T10:00:00Z'));
    touchStreak();
    vi.setSystemTime(new Date('2026-01-05T10:00:00Z')); // пропуск нескольких дней
    const s = touchStreak();
    expect(s.count).toBe(1);
    vi.useRealTimers();
  });
});
