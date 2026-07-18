export interface AiSettings {
  apiKey: string;
  model: string;
}

export const AI_MODELS = [
  { id: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash (быстрая)' },
  { id: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro (умнее)' },
  { id: 'google/gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite' },
] as const;

const LS_KEY = 'uziprep.ai.settings';

export function getAiSettings(): AiSettings {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // игнорируем битые данные
  }
  return { apiKey: '', model: AI_MODELS[0].id };
}

export function saveAiSettings(settings: AiSettings) {
  localStorage.setItem(LS_KEY, JSON.stringify(settings));
}

export function isAiConfigured(): boolean {
  return getAiSettings().apiKey.trim().length > 0;
}
