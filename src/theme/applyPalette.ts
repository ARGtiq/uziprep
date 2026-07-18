import type { M3Palette } from './palette.types';

function hexToRgbTriplet(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `${r} ${g} ${b}`;
}

const CSS_VAR_MAP: Record<keyof M3Palette, string> = {
  primary: '--m3-primary',
  onPrimary: '--m3-on-primary',
  primaryContainer: '--m3-primary-container',
  onPrimaryContainer: '--m3-on-primary-container',
  secondaryContainer: '--m3-secondary-container',
  onSecondaryContainer: '--m3-on-secondary-container',
  surface: '--m3-surface',
  surfaceContainerLow: '--m3-surface-container-low',
  surfaceContainer: '--m3-surface-container',
  surfaceContainerHigh: '--m3-surface-container-high',
  onSurface: '--m3-on-surface',
  onSurfaceVariant: '--m3-on-surface-variant',
  outline: '--m3-outline',
  outlineVariant: '--m3-outline-variant',
  error: '--m3-error',
};

/**
 * Единственное место в приложении, которое пишет CSS-переменные темы.
 * Всё остальное (Tailwind-классы, компоненты) читает только их.
 */
export function applyPalette(palette: M3Palette, target: HTMLElement = document.documentElement) {
  (Object.keys(CSS_VAR_MAP) as (keyof M3Palette)[]).forEach((key) => {
    target.style.setProperty(CSS_VAR_MAP[key], hexToRgbTriplet(palette[key]));
  });
}
