export type CharacterClass = 'warrior' | 'mage' | 'ranger' | 'healer';

export interface CharacterData {
  name: string;
  class: CharacterClass;
  createdAt: number;
}

const LS_KEY = 'uziprep.character';

export const CLASS_META: Record<CharacterClass, { label: string; blurb: string }> = {
  warrior: { label: 'Воин', blurb: 'Идёт напролом — челленджи и "без права на ошибку" даются легче всего' },
  mage: { label: 'Маг', blurb: 'Разбирается в сути — любит "Почему именно так?" и вопросы теории' },
  ranger: { label: 'Следопыт', blurb: 'Держит темп — таймированные форматы и "Экзаменационная лихорадка" его стихия' },
  healer: { label: 'Целитель', blurb: 'Не бросает начатое — держит серию дней и не пропускает повторения' },
};

export function getCharacter(): CharacterData | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveCharacter(data: CharacterData) {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

export function hasCharacter(): boolean {
  return getCharacter() !== null;
}

/**
 * Более мелкая шкала уровней, чем levelForXp из streakAndXp.ts (там
 * 6 крупных "статусов" вроде "Готов к экзамену") — тут нужна шкала с
 * заметным прогрессом на каждой тренировке, а не раз в сотню XP.
 */
const LEVEL_XP_STEP = 25; // XP на уровень, растёт с каждым уровнем

export function levelFromXp(xp: number): { level: number; xpIntoLevel: number; xpForNextLevel: number } {
  let level = 1;
  let remaining = xp;
  let step = LEVEL_XP_STEP;
  while (remaining >= step) {
    remaining -= step;
    level++;
    step = Math.round(LEVEL_XP_STEP * (1 + level * 0.15)); // каждый следующий уровень чуть дороже
  }
  return { level, xpIntoLevel: remaining, xpForNextLevel: step };
}

export function tierFromLevel(level: number): 1 | 2 | 3 | 4 | 5 {
  if (level >= 20) return 5;
  if (level >= 13) return 4;
  if (level >= 7) return 3;
  if (level >= 3) return 2;
  return 1;
}

export const TIER_LABEL: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'Новобранец',
  2: 'Подмастерье',
  3: 'Опытный',
  4: 'Ветеран',
  5: 'Легенда',
};
