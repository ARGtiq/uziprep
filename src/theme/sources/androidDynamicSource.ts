import type { M3Palette, ThemeMode, ThemeSource } from '../palette.types';
import { createSeedThemeSource } from './seedSource';

/**
 * Источник палитры №2 (для будущей нативной обёртки, Android 12+):
 * реальный системный Material You "от обоев". Веб/PWA не имеют доступа
 * к android.app.WallpaperColors — это должен прокинуть нативный слой
 * (Kotlin WebView + @JavascriptInterface, по аналогии с GaripovBridge),
 * положив в window.AndroidTheme.getDynamicColors() JSON вида M3Palette.
 *
 * Пока моста нет — тихо откатывается на seed-источник, чтобы приложение
 * не падало при запуске в обычном браузере.
 */
declare global {
  interface Window {
    AndroidTheme?: {
      getDynamicColors: (mode: ThemeMode) => string; // JSON.stringify<M3Palette>
    };
  }
}

export function createAndroidDynamicThemeSource(fallbackSeedHex: string): ThemeSource {
  const fallback = createSeedThemeSource(fallbackSeedHex);
  return {
    name: 'android-dynamic',
    getPalette(mode: ThemeMode): M3Palette {
      if (typeof window !== 'undefined' && window.AndroidTheme) {
        try {
          const raw = window.AndroidTheme.getDynamicColors(mode);
          return JSON.parse(raw) as M3Palette;
        } catch {
          // падаем на seed ниже
        }
      }
      return fallback.getPalette(mode) as M3Palette;
    },
  };
}
