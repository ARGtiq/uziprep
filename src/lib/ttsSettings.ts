const LS_RATE = 'uziprep.tts.rate';
const LS_VOICE_URI = 'uziprep.tts.voiceURI';

export function getTtsRate(): number {
  const raw = localStorage.getItem(LS_RATE);
  return raw ? Number(raw) : 0.95;
}

export function setTtsRate(rate: number) {
  localStorage.setItem(LS_RATE, String(rate));
}

export function getTtsVoiceURI(): string | null {
  return localStorage.getItem(LS_VOICE_URI);
}

export function setTtsVoiceURI(uri: string | null) {
  if (uri) localStorage.setItem(LS_VOICE_URI, uri);
  else localStorage.removeItem(LS_VOICE_URI);
}

/** Список голосов подходящих для озвучки — сперва русские, потом остальные (на случай, если ru недоступен). */
export function listAvailableVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  const all = window.speechSynthesis.getVoices();
  const ru = all.filter((v) => v.lang.toLowerCase().startsWith('ru'));
  const rest = all.filter((v) => !v.lang.toLowerCase().startsWith('ru'));
  return [...ru, ...rest];
}

/** Выбранный пользователем голос, либо первый русский по умолчанию, либо null. */
export function resolveSelectedVoice(): SpeechSynthesisVoice | null {
  const voices = listAvailableVoices();
  const savedUri = getTtsVoiceURI();
  if (savedUri) {
    const match = voices.find((v) => v.voiceURI === savedUri);
    if (match) return match;
  }
  return voices.find((v) => v.lang.toLowerCase().startsWith('ru')) ?? null;
}
