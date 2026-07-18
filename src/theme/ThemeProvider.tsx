import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ThemeMode, ThemeSource } from './palette.types';
import { applyPalette } from './applyPalette';
import { createSeedThemeSource } from './sources/seedSource';
import { createAndroidDynamicThemeSource } from './sources/androidDynamicSource';

const DEFAULT_SEED = '#0F6E56';

// Реестр доступных источников палитры. Добавление нового варианта
// (например iOS-эквивалента в будущем) — это просто ещё одна запись тут.
function buildSourceRegistry(seedHex: string): Record<string, ThemeSource> {
  return {
    seed: createSeedThemeSource(seedHex),
    'android-dynamic': createAndroidDynamicThemeSource(seedHex),
  };
}

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  sourceKey: string;
  setSourceKey: (k: string) => void;
  seedHex: string;
  setSeedHex: (hex: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const LS_MODE = 'uziprep.theme.mode';
const LS_SOURCE = 'uziprep.theme.source';
const LS_SEED = 'uziprep.theme.seed';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(
    () => (localStorage.getItem(LS_MODE) as ThemeMode) ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
  );
  const [sourceKey, setSourceKey] = useState(() => localStorage.getItem(LS_SOURCE) || 'seed');
  const [seedHex, setSeedHex] = useState(() => localStorage.getItem(LS_SEED) || DEFAULT_SEED);

  const registry = useMemo(() => buildSourceRegistry(seedHex), [seedHex]);

  useEffect(() => {
    localStorage.setItem(LS_MODE, mode);
    localStorage.setItem(LS_SOURCE, sourceKey);
    localStorage.setItem(LS_SEED, seedHex);
    document.documentElement.dataset.mode = mode;

    const source = registry[sourceKey] ?? registry.seed;
    Promise.resolve(source.getPalette(mode)).then((palette) => applyPalette(palette));
  }, [mode, sourceKey, seedHex, registry]);

  const value: ThemeContextValue = { mode, setMode, sourceKey, setSourceKey, seedHex, setSeedHex };
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
