import { useEffect, useState } from 'react';
import { useTheme } from '@/theme/ThemeProvider';
import { useAuth } from '@/lib/useAuth';
import { fullSync } from '@/lib/sync';
import { Icon } from '@/components/Icon';
import {
  type AiProvider,
  OPENROUTER_MODELS,
  GOOGLE_MODELS,
  getAiSettings,
  saveAiSettings,
} from '@/lib/aiSettings';

import { extractDominantColorHex } from '@/theme/sources/imageSource';
import { getSupabaseSettings, saveSupabaseSettings, clearSupabaseSettings } from '@/lib/supabase';

export function ProfileScreen() {
  const { mode, setMode, seedHex, setSeedHex, sourceKey, setSourceKey } = useTheme();
  const { session, loading, configured, authError, signInWithEmail, resendMagicLink, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'done' | 'error'>('idle');

  const [aiProvider, setAiProvider] = useState<AiProvider>('google');
  const [openrouterKey, setOpenrouterKey] = useState('');
  const [openrouterModel, setOpenrouterModel] = useState<string>(OPENROUTER_MODELS[0].id);
  const [googleKey, setGoogleKey] = useState('');
  const [googleModel, setGoogleModel] = useState<string>(GOOGLE_MODELS[0].id);
  const [aiSaved, setAiSaved] = useState(false);
  const [extractingColor, setExtractingColor] = useState(false);
  const [sbUrl, setSbUrl] = useState('');
  const [sbAnonKey, setSbAnonKey] = useState('');
  const [sbSaved, setSbSaved] = useState(false);

  useEffect(() => {
    const s = getSupabaseSettings();
    setSbUrl(s.url);
    setSbAnonKey(s.anonKey);
  }, []);

  function handleSaveSupabase(e: React.FormEvent) {
    e.preventDefault();
    saveSupabaseSettings({ url: sbUrl.trim(), anonKey: sbAnonKey.trim() });
    setSbSaved(true);
    setTimeout(() => setSbSaved(false), 2000);
  }

  function handleClearSupabase() {
    clearSupabaseSettings();
    setSbUrl('');
    setSbAnonKey('');
  }

  async function handlePickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // чтобы повторный выбор того же файла тоже сработал
    if (!file) return;
    setExtractingColor(true);
    try {
      const hex = await extractDominantColorHex(file);
      setSeedHex(hex);
    } catch {
      // тихо игнорируем — пользователь просто не увидит изменения цвета
    } finally {
      setExtractingColor(false);
    }
  }

  useEffect(() => {
    const s = getAiSettings();
    setAiProvider(s.provider);
    setOpenrouterKey(s.openrouterKey);
    setOpenrouterModel(s.openrouterModel);
    setGoogleKey(s.googleKey);
    setGoogleModel(s.googleModel);
  }, []);

  useEffect(() => {
    if (!session) return;
    setSyncState('syncing');
    fullSync(session.user.id)
      .then(() => setSyncState('done'))
      .catch(() => setSyncState('error'));
  }, [session]);

  function handleSaveAi(e: React.FormEvent) {
    e.preventDefault();
    saveAiSettings({
      provider: aiProvider,
      openrouterKey: openrouterKey.trim(),
      openrouterModel,
      googleKey: googleKey.trim(),
      googleModel,
    });
    setAiSaved(true);
    setTimeout(() => setAiSaved(false), 2000);
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const { error } = await signInWithEmail(email);
    if (error) setFormError(error);
    else setSentTo(email);
  }

  async function handleResend() {
    if (!sentTo) return;
    setResending(true);
    const { error } = await resendMagicLink(sentTo);
    setResending(false);
    if (error) setFormError(error);
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Профиль</h1>

      {!configured && (
        <form onSubmit={handleSaveSupabase} className="mb-4 rounded-m3-md bg-secondary-container p-3.5 text-on-secondary-container">
          <b className="mb-1 block text-sm">Supabase не настроен</b>
          <p className="mb-3 text-xs">
            Прогресс хранится только на этом устройстве. Чтобы включить вход и синхронизацию — создай проект на{' '}
            <a href="https://supabase.com" target="_blank" rel="noreferrer" className="underline">
              supabase.com
            </a>
            , выполни <code className="rounded bg-surface px-1 py-0.5">supabase/schema.sql</code> из репозитория в его SQL
            Editor, и вставь сюда данные из Project Settings → API.
          </p>
          <label className="mb-1 block text-xs">Project URL</label>
          <input
            value={sbUrl}
            onChange={(e) => setSbUrl(e.target.value)}
            placeholder="https://xxxxxxxx.supabase.co"
            className="mb-2 w-full rounded-m3-sm border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface"
          />
          <label className="mb-1 block text-xs">Anon (publishable) key</label>
          <input
            value={sbAnonKey}
            onChange={(e) => setSbAnonKey(e.target.value)}
            placeholder="eyJhbGci..."
            className="mb-3 w-full rounded-m3-sm border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface"
          />
          <button type="submit" className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-on-primary">
            {sbSaved ? 'Сохранено ✓' : 'Сохранить и подключить'}
          </button>
          <p className="mt-2 text-[11px] opacity-80">
            Ключ хранится в этом браузере. Anon-ключ безопасно светить на клиенте — доступ к данным ограничивает
            Row Level Security на стороне Supabase, не секретность ключа.
          </p>
        </form>
      )}

      {configured && (
        <div className="mb-4 flex items-center justify-between rounded-m3-md bg-surface-container-low p-3.5 text-xs text-on-surface-variant">
          <span>Supabase подключён: {getSupabaseSettings().url}</span>
          <button onClick={handleClearSupabase} className="text-error underline">
            Отключить
          </button>
        </div>
      )}

      {authError && (
        <div className="mb-4 rounded-m3-md bg-error/10 p-3.5 text-sm text-error">
          {authError === 'expired'
            ? 'Ссылка для входа устарела или уже использована. Запроси новую ниже.'
            : 'Ссылка для входа недействительна. Запроси новую ниже.'}
        </div>
      )}

      {configured && loading && (
        <div className="mb-5 rounded-m3-md bg-surface-container-low p-3.5 text-sm text-on-surface-variant">
          Проверка сессии...
        </div>
      )}

      {configured && !loading && !session && (
        <div className="mb-5 rounded-m3-md bg-surface-container-low p-3.5">
          <h3 className="mb-1 text-sm font-semibold">Вход</h3>
          <p className="mb-3 text-xs text-on-surface-variant">
            Ссылка для входа придёт на почту — без пароля. Нужен только для синхронизации прогресса между устройствами.
          </p>
          {sentTo ? (
            <div>
              <p className="mb-2 text-sm text-primary">Ссылка отправлена на {sentTo}. Проверь почту.</p>
              <p className="mb-2 text-xs text-on-surface-variant">Не пришло письмо? Проверь папку "Спам" или запроси ещё раз.</p>
              <button
                onClick={handleResend}
                disabled={resending}
                className="rounded-full border border-outline-variant px-4 py-2 text-sm font-semibold disabled:opacity-50"
              >
                {resending ? 'Отправка...' : 'Отправить ещё раз'}
              </button>
              <button onClick={() => setSentTo(null)} className="ml-2 text-xs text-on-surface-variant underline">
                Изменить email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSignIn} className="flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="flex-1 rounded-m3-sm border border-outline-variant bg-surface px-3 py-2 text-sm"
              />
              <button type="submit" className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary">
                Войти
              </button>
            </form>
          )}
          {formError && <p className="mt-2 text-xs text-error">{formError}</p>}
        </div>
      )}

      {configured && session && (
        <div className="mb-5 flex items-center gap-3.5 rounded-m3-md bg-surface-container-low p-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-container font-semibold text-on-primary-container">
            {session.user.email?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold">{session.user.email}</h3>
            <div className="flex items-center gap-1 text-xs text-on-surface-variant">
              {syncState === 'syncing' && 'Синхронизация...'}
              {syncState === 'done' && (
                <>
                  <Icon name="check_circle" size={12} className="text-primary" /> Прогресс синхронизирован
                </>
              )}
              {syncState === 'error' && 'Ошибка синхронизации, попробуй позже'}
              {syncState === 'idle' && 'Локальный режим'}
            </div>
          </div>
          <button onClick={signOut} aria-label="Выйти" className="text-on-surface-variant">
            <Icon name="close" size={18} />
          </button>
        </div>
      )}

      {(!configured || (!session && !loading)) && (
        <div className="mb-5 flex items-center gap-3.5 rounded-m3-md bg-surface-container-low p-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-container font-semibold text-on-primary-container">Г</div>
          <div>
            <h3 className="text-sm font-semibold">Гость</h3>
            <div className="text-xs text-on-surface-variant">Локальный режим</div>
          </div>
        </div>
      )}

      <h2 className="mb-2 text-sm font-semibold text-on-surface-variant">Тема</h2>
      <div className="mb-4 rounded-m3-md bg-surface-container-low p-3.5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm">Тёмная тема</span>
          <button
            onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
            className={`h-6 w-11 rounded-full transition-colors ${mode === 'dark' ? 'bg-primary' : 'bg-outline-variant'}`}
          >
            <div className={`h-5 w-5 rounded-full bg-surface transition-transform ${mode === 'dark' ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>

        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm">Источник палитры</span>
          <select
            value={sourceKey}
            onChange={(e) => setSourceKey(e.target.value)}
            className="rounded-m3-sm border border-outline-variant bg-surface px-2 py-1.5 text-sm"
          >
            <option value="seed">Ручной цвет</option>
            <option value="android-dynamic">Системный Android (Material You)</option>
          </select>
        </div>

        {sourceKey === 'seed' && (
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Основной цвет</span>
              <input
                type="color"
                value={seedHex}
                onChange={(e) => setSeedHex(e.target.value)}
                className="h-8 w-8 cursor-pointer rounded-m3-sm border border-outline-variant bg-transparent"
              />
            </div>
            <label className="mt-3 flex items-center justify-between text-sm">
              <span>Или взять цвет из фото</span>
              <span className="cursor-pointer rounded-full border border-outline-variant px-3 py-1.5 text-xs font-semibold">
                {extractingColor ? 'Обработка...' : 'Выбрать фото'}
                <input type="file" accept="image/*" className="hidden" onChange={handlePickImage} disabled={extractingColor} />
              </span>
            </label>
          </div>
        )}
        {sourceKey === 'android-dynamic' && (
          <p className="text-xs text-on-surface-variant">
            Работает только внутри нативной Android-обёртки. В браузере — откат на ручной цвет.
          </p>
        )}
      </div>

      <h2 className="mb-2 text-sm font-semibold text-on-surface-variant">AI-репетитор</h2>
      <form onSubmit={handleSaveAi} className="mb-4 rounded-m3-md bg-surface-container-low p-3.5">
        <div className="mb-3 flex gap-2">
          <button
            type="button"
            onClick={() => setAiProvider('google')}
            className={`flex-1 rounded-full py-2 text-sm font-semibold ${aiProvider === 'google' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'}`}
          >
            Google AI
          </button>
          <button
            type="button"
            onClick={() => setAiProvider('openrouter')}
            className={`flex-1 rounded-full py-2 text-sm font-semibold ${aiProvider === 'openrouter' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'}`}
          >
            OpenRouter
          </button>
        </div>

        {aiProvider === 'google' ? (
          <>
            <p className="mb-3 text-xs text-on-surface-variant">
              Ключ Google AI Studio (бесплатный тариф доступен):{' '}
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-primary underline">
                aistudio.google.com/apikey
              </a>
            </p>
            <label className="mb-1 block text-xs text-on-surface-variant">API-ключ Google AI</label>
            <input
              type="password"
              value={googleKey}
              onChange={(e) => setGoogleKey(e.target.value)}
              placeholder="AIza..."
              className="mb-3 w-full rounded-m3-sm border border-outline-variant bg-surface px-3 py-2 text-sm"
            />
            <label className="mb-1 block text-xs text-on-surface-variant">Модель</label>
            <div className="mb-1 flex flex-col gap-1.5">
              {GOOGLE_MODELS.map((m) => (
                <label
                  key={m.id}
                  className={`flex items-center gap-2.5 rounded-m3-sm border p-2.5 text-sm ${googleModel === m.id ? 'border-primary bg-primary-container' : 'border-outline-variant'}`}
                >
                  <input type="radio" name="google-model" checked={googleModel === m.id} onChange={() => setGoogleModel(m.id)} className="accent-[rgb(var(--m3-primary))]" />
                  {m.label}
                </label>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="mb-3 text-xs text-on-surface-variant">
              Единый ключ для доступа к разным моделям:{' '}
              <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="text-primary underline">
                openrouter.ai/keys
              </a>
            </p>
            <label className="mb-1 block text-xs text-on-surface-variant">API-ключ OpenRouter</label>
            <input
              type="password"
              value={openrouterKey}
              onChange={(e) => setOpenrouterKey(e.target.value)}
              placeholder="sk-or-v1-..."
              className="mb-3 w-full rounded-m3-sm border border-outline-variant bg-surface px-3 py-2 text-sm"
            />
            <label className="mb-1 block text-xs text-on-surface-variant">Модель</label>
            <div className="mb-1 flex flex-col gap-1.5">
              {OPENROUTER_MODELS.map((m) => (
                <label
                  key={m.id}
                  className={`flex items-center gap-2.5 rounded-m3-sm border p-2.5 text-sm ${openrouterModel === m.id ? 'border-primary bg-primary-container' : 'border-outline-variant'}`}
                >
                  <input type="radio" name="or-model" checked={openrouterModel === m.id} onChange={() => setOpenrouterModel(m.id)} className="accent-[rgb(var(--m3-primary))]" />
                  {m.label}
                </label>
              ))}
            </div>
          </>
        )}

        <p className="mb-3 text-xs text-on-surface-variant">Ключ хранится только в этом браузере, никуда, кроме выбранного провайдера, не уходит.</p>
        <button type="submit" className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-on-primary">
          {aiSaved ? 'Сохранено ✓' : 'Сохранить настройки AI'}
        </button>
      </form>
    </div>
  );
}
