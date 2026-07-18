/**
 * M3 Palette — единый контракт "источник цвета -> UI".
 *
 * Неважно, откуда взялась палитра:
 *  - сгенерирована из seed-цвета (material-color-utilities) в вебе,
 *  - прочитана из системных Android-ресурсов (system_accent1_*) через
 *    нативный мост (window.AndroidTheme.getDynamicColors()),
 *  - выставлена пользователем вручную в настройках.
 *
 * UI-компоненты никогда не обращаются к источнику напрямую — только
 * к CSS-переменным, которые выставляет applyPalette(). Замена источника
 * цвета = замена одной функции-провайдера, разметка и стили не трогаются.
 */
export interface M3Palette {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  surface: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  onSurface: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  error: string;
}

export type ThemeMode = 'light' | 'dark';

export interface ThemeSource {
  /** Человекочитаемое имя источника, для дебага/настроек */
  name: string;
  /** Вернуть палитру для текущего режима. Может быть async (нативный мост). */
  getPalette: (mode: ThemeMode) => Promise<M3Palette> | M3Palette;
}
