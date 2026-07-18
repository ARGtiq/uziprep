import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

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
  const [loading, setLoading] = useState(isSupabaseConfigured());
  const [authError, setAuthError] = useState<AuthErrorKind>(null);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    setAuthError(readAuthErrorFromUrl());
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) setAuthError(null);
    });
    return () => sub.subscription.unsubscribe();
    // Перечитываем при смене configured — например, после того как
    // пользователь сохранил настройки Supabase прямо в приложении и
    // клиент только что появился (был null).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured]);

  async function signInWithEmail(email: string) {
    const supabase = getSupabase();
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
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  return { session, loading, configured, authError, signInWithEmail, resendMagicLink, signOut };
}
