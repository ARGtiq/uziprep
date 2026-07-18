import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseSettings {
  url: string;
  anonKey: string;
}

const LS_KEY = 'uziprep.supabase.settings';

/**
 * Приоритет источников: сохранённые в localStorage настройки (введённые
 * прямо в приложении, Профиль → Supabase) важнее переменных окружения
 * сборки. Так можно настроить синхронизацию, просто вставив URL и
 * anon-ключ в форму — без GitHub Secrets и пересборки сайта. Секреты
 * сборки (.env / GitHub Actions) остаются рабочим вариантом по умолчанию
 * для тех, кто предпочитает не хранить ключ в localStorage браузера.
 */
export function getSupabaseSettings(): SupabaseSettings {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SupabaseSettings;
      if (parsed.url && parsed.anonKey) return parsed;
    }
  } catch {
    // игнорируем битые данные
  }
  return {
    url: (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '',
    anonKey: (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? '',
  };
}

export function saveSupabaseSettings(settings: SupabaseSettings) {
  localStorage.setItem(LS_KEY, JSON.stringify(settings));
  resetSupabaseClient();
}

export function clearSupabaseSettings() {
  localStorage.removeItem(LS_KEY);
  resetSupabaseClient();
}

let cachedClient: SupabaseClient | null | undefined;

/**
 * Ленивая инициализация с кэшем. resetSupabaseClient() сбрасывает кэш,
 * когда пользователь меняет настройки в UI — следующий вызов getSupabase()
 * создаст клиент заново с новыми url/ключом (старая сессия автоматически
 * "теряется", это ожидаемо при смене проекта Supabase).
 */
export function getSupabase(): SupabaseClient | null {
  if (cachedClient !== undefined) return cachedClient;
  const { url, anonKey } = getSupabaseSettings();
  cachedClient = url && anonKey ? createClient(url, anonKey) : null;
  return cachedClient;
}

export function resetSupabaseClient() {
  cachedClient = undefined;
}

export function isSupabaseConfigured(): boolean {
  return getSupabase() !== null;
}
