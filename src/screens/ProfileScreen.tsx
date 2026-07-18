import { useTheme } from '@/theme/ThemeProvider';

export function ProfileScreen() {
  const { mode, setMode, seedHex, setSeedHex, sourceKey, setSourceKey } = useTheme();

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Профиль</h1>

      <div className="mb-5 flex items-center gap-3.5 rounded-m3-md bg-surface-container-low p-3.5">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-container font-semibold text-on-primary-container">Г</div>
        <div>
          <h3 className="text-sm font-semibold">Гость</h3>
          <div className="text-xs text-on-surface-variant">Локальный режим</div>
        </div>
      </div>

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

      <h2 className="mb-2 text-sm font-semibold text-on-surface-variant">Синхронизация</h2>
      <p className="text-sm text-on-surface-variant">
        Supabase — авторизация и прогресс между устройствами (подключение — в следующей итерации).
      </p>
    </div>
  );
}
