import { describe, it, expect } from 'vitest';
import { formatMs } from '@/lib/bestTimes';

describe('formatMs', () => {
  it('форматирует секунды без минут', () => {
    expect(formatMs(45000)).toBe('45с');
  });
  it('форматирует с минутами', () => {
    expect(formatMs(125000)).toBe('2м 5с');
  });
  it('округляет до ближайшей секунды', () => {
    expect(formatMs(1400)).toBe('1с');
  });
});
