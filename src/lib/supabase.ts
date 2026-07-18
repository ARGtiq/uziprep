import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * Supabase настроен опционально. Если переменные окружения не заданы
 * (например, при первом запуске без .env) — приложение продолжает
 * работать полностью в локальном режиме (Dexie), просто без облачной
 * синхронизации. Это тот же принцип "заменяемого слоя", что и в теме:
 * остальной код не должен падать из-за отсутствия конфигурации.
 */
export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null;

export const isSupabaseConfigured = supabase !== null;
