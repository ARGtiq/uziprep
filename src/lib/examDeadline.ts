const LS_KEY = 'uziprep.examDate';

/** Дата экзамена в формате YYYY-MM-DD, или null если не задана. */
export function getExamDate(): string | null {
  return localStorage.getItem(LS_KEY);
}

export function setExamDate(date: string | null) {
  if (date) localStorage.setItem(LS_KEY, date);
  else localStorage.removeItem(LS_KEY);
}

export function daysUntilExam(): number | null {
  const date = getExamDate();
  if (!date) return null;
  const diff = new Date(date).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}
