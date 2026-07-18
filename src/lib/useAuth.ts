import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

type AuthErrorKind = 'expired' | 'invalid' | null;

interface AuthState {
  session: Session | null;
  loading: boolean;
  configured: boolean;
  authError: AuthErrorKind;
  signInWithEmail: (email: string) => Promise<{ error: string | null }>;
  resendMagicLink: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

/**
 * Supabase кладёt ошибку истёкшей/недействительной magic-link ссылки
 * в hash редиректа (#error=access_denied&error_code=otp_expired&...),
 * а не в обычный query. Разбираем один раз при загрузке и сразу же
 * чистим hash из адресной строки, чтобы при обновлении страницы
 * ошибка не всплывала повторно.
 */
function readAuthErrorFromUrl(): AuthErrorKind {
  if (!window.location.hash.includes('error')) return null;
  const params = new URLSearchParams(window.location.hash.slice(1));
  const code = params.get('error_code');
  const result: AuthErrorKind = code === 'otp_expired' ? 'expired' : 'invalid';
  window.history.replaceState(null, '', window.location.pathname + window.location.search);
  return result;
}

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [authError, setAuthError] = useState<AuthErrorKind>(null);

  useEffect(() => {
    setAuthError(readAuthErrorFromUrl());
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) setAuthError(null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signInWithEmail(email: string) {
    if (!supabase) return { error: 'Supabase не настроен' };
    setAuthError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.href.split('#')[0] },
    });
    return { error: error?.message ?? null };
  }

  async function resendMagicLink(email: string) {
    return signInWithEmail(email);
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  return { session, loading, configured: isSupabaseConfigured, authError, signInWithEmail, resendMagicLink, signOut };
}
