import type { IntroDialogueRow } from '@/types/station';

/** Значимые слова триггера (длиннее 3 букв, без стоп-слов) — для сопоставления с текстом шага. */
const STOPWORDS = new Set(['при', 'после', 'если', 'для', 'или', 'уже', 'ещё', 'сразу', 'лица', 'над', 'под', 'том', 'что']);

function keywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[«».,()]/g, '')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
}

/**
 * Реплики члена АПК ("Таблица N...") привязаны к конкретному моменту
 * ("trigger") — часто это буквально тот же шаг алгоритма ("При
 * вопросе о ФИО" ↔ шаг "Спросить у пациента... ФИО"). Вместо того
 * чтобы держать все реплики отдельным списком в стороне, находим,
 * какой шаг их вызывает, и показываем мельче прямо под ним — так
 * видно не только ЧТО делать, но и ЧТО при этом скажет пациент/АПК.
 *
 * Не привязавшиеся реплики (например, самая первая вводная станции,
 * звучащая до начала списка шагов) остаются в общем IntroDialogueBox.
 */
export function matchIntroToStep(stepText: string, introDialogue: IntroDialogueRow[]): IntroDialogueRow[] {
  const stepWords = new Set(keywords(stepText));
  if (stepWords.size === 0) return [];
  return introDialogue.filter((row) => {
    const triggerWords = keywords(row.trigger);
    if (triggerWords.length === 0) return false;
    const overlap = triggerWords.filter((w) => stepWords.has(w)).length;
    return overlap / triggerWords.length >= 0.5; // минимум половина значимых слов триггера встречается в шаге
  });
}

/** Реплики, которые не привязались ни к одному шагу станции — остаются в общем блоке. */
export function unmatchedIntroRows(allSteps: string[], introDialogue: IntroDialogueRow[]): IntroDialogueRow[] {
  return introDialogue.filter((row) => !allSteps.some((stepText) => matchIntroToStep(stepText, [row]).length > 0));
}
