import { argbFromHex, hexFromArgb, themeFromSourceColor } from '@material/material-color-utilities';
import type { M3Palette, ThemeMode, ThemeSource } from '../palette.types';

/**
 * Источник палитры №1 (используется сейчас): генерация полной M3
 * tonal-палитры из одного seed-цвета. Работает одинаково в браузере,
 * PWA и WebView — не зависит от платформы.
 */
export function createSeedThemeSource(seedHex: string): ThemeSource {
  return {
    name: `seed:${seedHex}`,
    getPalette(mode: ThemeMode): M3Palette {
      const theme = themeFromSourceColor(argbFromHex(seedHex));
      const scheme = mode === 'dark' ? theme.schemes.dark : theme.schemes.light;
      const hex = (argb: number) => hexFromArgb(argb);
      return {
        primary: hex(scheme.primary),
        onPrimary: hex(scheme.onPrimary),
        primaryContainer: hex(scheme.primaryContainer),
        onPrimaryContainer: hex(scheme.onPrimaryContainer),
        secondaryContainer: hex(scheme.secondaryContainer),
        onSecondaryContainer: hex(scheme.onSecondaryContainer),
        surface: hex(scheme.surface),
        surfaceContainerLow: hex((scheme as any).surfaceContainerLow ?? scheme.surfaceVariant),
        surfaceContainer: hex((scheme as any).surfaceContainer ?? scheme.surfaceVariant),
        surfaceContainerHigh: hex((scheme as any).surfaceContainerHigh ?? scheme.surfaceVariant),
        onSurface: hex(scheme.onSurface),
        onSurfaceVariant: hex(scheme.onSurfaceVariant),
        outline: hex(scheme.outline),
        outlineVariant: hex(scheme.outlineVariant),
        error: hex(scheme.error),
      };
    },
  };
}
