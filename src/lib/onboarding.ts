const LS_KEY = 'uziprep.onboarding.seen';

export function hasSeenOnboarding(): boolean {
  return localStorage.getItem(LS_KEY) === '1';
}

export function markOnboardingSeen() {
  localStorage.setItem(LS_KEY, '1');
}
