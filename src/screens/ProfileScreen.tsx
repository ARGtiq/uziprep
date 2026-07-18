import { useEffect, useState } from 'react';
import { useTheme } from '@/theme/ThemeProvider';
import { useAuth } from '@/lib/useAuth';
import { fullSync } from '@/lib/sync';
import { Icon } from '@/components/Icon';
import { AI_MODELS, getAiSettings, saveAiSettings } from '@/lib/aiSettings';

export function ProfileScreen() {
  const { mode, setMode, seedHex, setSeedHex, sourceKey, setSourceKey } = useTheme();
  const { session, loading, configured, signInWithEmail, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'done' | 'error'>('idle');
  const [aiKey, setAiKey] = useState('');
  const [aiModel, setAiModel] = useState(AI_MODELS[0].id);
  const [aiSaved, setAiSaved] = useState(false);

  useEffect(() => {
    const s = getAiSettings();
    setAiKey(s.apiKey);
    setAiModel(s.model);
  }, []);

  function handleSaveAi(e: React.FormEvent) {
    e.preventDefault();
    saveAiSettings({ apiKey: aiKey.trim(), model: aiModel });
    setAiSaved(true);
    setTimeout(() => setAiSaved(false), 2000);
  }

  useEffect(() => {
    if (!session) return;
    setSyncState('syncing');
    fullSync(session.user.id)
      .then(() => setSyncState('done'))
      .catch(() => setSyncState('error'));
  }, [session]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    const { error } = await signInWithEmail(email);
    if (error) setAuthError(error);
    else setSentTo(email);
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Профиль</h1>

      {!configured && (
        <div className="mb-4 rounded-m3-md bg-secondary-container p-3.5 text-sm text-on-secondary-container">
          <b>Supabase не настроен.</b> Прогресс хранится только на этом устройстве, без синхронизации.
          Чтобы включить вход и синк между устройствами — добавь секреты{' '}
          <code className="rounded bg-surface px-1 py-0.5 text-xs">VITE_SUPABASE_URL</code> и{' '}
          <code className="rounded bg-surface px-1 py-0.5 text-xs">VITE_SUPABASE_ANON_KEY</code> в
          Settings → Secrets and variables → Actions репозитория на GitHub и пересобери сайт (детали в README).
        </div>
      )}

      {configured && loading && (
        <div className="mb-5 flex items-center gap-3.5 rounded-m3-md bg-surface-container-low p-3.5 text-sm text-on-surface-variant">
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
            <p className="text-sm text-primary">Ссылка отправлена на {sentTo}. Проверь почту.</p>
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
          {authError && <p className="mt-2 text-xs text-error">{authError}</p>}
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
            <option value="seed">Ручной цвет (seed)</option>
            <option value="android-dynamic">Системный Android (Material You)</option>
          </select>
        </div>

        {sourceKey === 'seed' && (
          <div className="flex items-center justify-between">
            <span className="text-sm">Основной цвет</span>
            <input
              type="color"
              value={seedHex}
              onChange={(e) => setSeedHex(e.target.value)}
              className="h-8 w-8 cursor-pointer rounded-m3-sm border border-outline-variant bg-transparent"
            />
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
        <p className="mb-3 text-xs text-on-surface-variant">
          Через OpenRouter — единый ключ для доступа к разным моделям. Получить ключ:{' '}
          <a
            href="https://openrouter.ai/keys"
            target="_blank"
            rel="noreferrer"
            className="text-primary underline"
          >
            openrouter.ai/keys
          </a>
          . Ключ хранится только в этом браузере (localStorage), никуда, кроме OpenRouter, не уходит.
        </p>

        <label className="mb-1 block text-xs text-on-surface-variant">API-ключ OpenRouter</label>
        <input
          type="password"
          value={aiKey}
          onChange={(e) => setAiKey(e.target.value)}
          placeholder="sk-or-v1-..."
          className="mb-3 w-full rounded-m3-sm border border-outline-variant bg-surface px-3 py-2 text-sm"
        />

        <label className="mb-1 block text-xs text-on-surface-variant">Модель</label>
        <div className="mb-3 flex flex-col gap-1.5">
          {AI_MODELS.map((m) => (
            <label
              key={m.id}
              className={`flex items-center gap-2.5 rounded-m3-sm border p-2.5 text-sm ${
                aiModel === m.id ? 'border-primary bg-primary-container' : 'border-outline-variant'
              }`}
            >
              <input
                type="radio"
                name="ai-model"
                checked={aiModel === m.id}
                onChange={() => setAiModel(m.id)}
                className="accent-[rgb(var(--m3-primary))]"
              />
              {m.label}
            </label>
          ))}
        </div>

        <button type="submit" className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-on-primary">
          {aiSaved ? 'Сохранено ✓' : 'Сохранить настройки AI'}
        </button>
      </form>
    </div>
  );
}
