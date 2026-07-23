const LS_KEY = 'uziprep.studyPlan.done';

export function getPlanProgress(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? '{}');
  } catch {
    return {};
  }
}

export function setPlanStepDone(stepId: string, done: boolean) {
  const current = getPlanProgress();
  current[stepId] = done;
  localStorage.setItem(LS_KEY, JSON.stringify(current));
}
