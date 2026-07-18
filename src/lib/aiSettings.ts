export type AiProvider = 'openrouter' | 'google';

export interface AiSettings {
  provider: AiProvider;
  openrouterKey: string;
  openrouterModel: string;
  googleKey: string;
  googleModel: string;
}

export const OPENROUTER_MODELS = [
  { id: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash (быстрая)' },
  { id: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro (умнее)' },
  { id: 'google/gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite' },
] as const;

export const GOOGLE_MODELS = [
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (быстрая)' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (умнее)' },
  { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite' },
] as const;

const LS_KEY = 'uziprep.ai.settings';

const DEFAULTS: AiSettings = {
  provider: 'google',
  openrouterKey: '',
  openrouterModel: OPENROUTER_MODELS[0].id,
  googleKey: '',
  googleModel: GOOGLE_MODELS[0].id,
};

export function getAiSettings(): AiSettings {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    // игнорируем битые данные
  }
  return { ...DEFAULTS };
}

export function saveAiSettings(settings: AiSettings) {
  localStorage.setItem(LS_KEY, JSON.stringify(settings));
}

export function isAiConfigured(): boolean {
  const s = getAiSettings();
  return s.provider === 'google' ? s.googleKey.trim().length > 0 : s.openrouterKey.trim().length > 0;
}
