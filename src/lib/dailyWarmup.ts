const LS_KEY = 'uziprep.warmup.lastShown';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function shouldShowWarmup(): boolean {
  return localStorage.getItem(LS_KEY) !== todayKey();
}

export function markWarmupShown() {
  localStorage.setItem(LS_KEY, todayKey());
}
