const LS_KEY = 'uziprep.scenarioViewMode';

export type ScenarioViewMode = 'inline' | 'grid';

/** Глобальная настройка (применяется на всё приложение, не per-станция). */
export function getScenarioViewMode(): ScenarioViewMode {
  return (localStorage.getItem(LS_KEY) as ScenarioViewMode) || 'inline';
}

export function setScenarioViewMode(mode: ScenarioViewMode) {
  localStorage.setItem(LS_KEY, mode);
}
