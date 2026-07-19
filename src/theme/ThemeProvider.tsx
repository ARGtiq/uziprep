import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ThemeMode, ThemeSource } from './palette.types';
import { applyPalette } from './applyPalette';
import { createSeedThemeSource } from './sources/seedSource';
import { createAndroidDynamicThemeSource } from './sources/androidDynamicSource';

const DEFAULT_SEED = '#0F6E56';

export type ThemePreference = 'light' | 'dark' | 'system';

// Реестр доступных источников палитры. Добавление нового варианта
// (например iOS-эквивалента в будущем) — это просто ещё одна запись тут.
function buildSourceRegistry(seedHex: string): Record<string, ThemeSource> {
  return {
    seed: createSeedThemeSource(seedHex),
    'android-dynamic': createAndroidDynamicThemeSource(seedHex),
  };
}

function resolveSystemMode(): ThemeMode {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

interface ThemeContextValue {
  /** Выбор пользователя: light/dark/system — то, что показываем в UI переключателя */
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
  /** Реально применённый режим (system уже разрешён в light/dark) — то, что уходит в генератор палитры */
  mode: ThemeMode;
  sourceKey: string;
  setSourceKey: (k: string) => void;
  seedHex: string;
  setSeedHex: (hex: string) => void;
  /** Разноцветные иконки станций/режимов вместо однотонных бейджей темы */
  colorfulIcons: boolean;
  setColorfulIcons: (v: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const LS_PREFERENCE = 'uziprep.theme.preference';
const LS_SOURCE = 'uziprep.theme.source';
const LS_SEED = 'uziprep.theme.seed';
const LS_COLORFUL_ICONS = 'uziprep.theme.colorfulIcons';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>(
    () => (localStorage.getItem(LS_PREFERENCE) as ThemePreference) || 'system',
  );
  const [systemMode, setSystemMode] = useState<ThemeMode>(resolveSystemMode);
  const [sourceKey, setSourceKey] = useState(() => localStorage.getItem(LS_SOURCE) || 'seed');
  const [seedHex, setSeedHex] = useState(() => localStorage.getItem(LS_SEED) || DEFAULT_SEED);
  const [colorfulIcons, setColorfulIcons] = useState(() => localStorage.getItem(LS_COLORFUL_ICONS) === '1');

  const mode: ThemeMode = preference === 'system' ? systemMode : preference;
  const registry = useMemo(() => buildSourceRegistry(seedHex), [seedHex]);

  // Живое отслеживание системной темы — актуально только когда
  // preference === 'system', но слушатель безвредно висит всегда,
  // проще чем подписывать/отписывать по условию.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setSystemMode(mq.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    localStorage.setItem(LS_PREFERENCE, preference);
    localStorage.setItem(LS_SOURCE, sourceKey);
    localStorage.setItem(LS_SEED, seedHex);
    localStorage.setItem(LS_COLORFUL_ICONS, colorfulIcons ? '1' : '0');
    document.documentElement.dataset.mode = mode;

    const source = registry[sourceKey] ?? registry.seed;
    Promise.resolve(source.getPalette(mode)).then((palette) => applyPalette(palette));
  }, [preference, mode, sourceKey, seedHex, colorfulIcons, registry]);

  const value: ThemeContextValue = {
    preference,
    setPreference,
    mode,
    sourceKey,
    setSourceKey,
    seedHex,
    setSeedHex,
    colorfulIcons,
    setColorfulIcons,
  };
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
