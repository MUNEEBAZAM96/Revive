import { useColorScheme } from 'react-native';

import { cosmeticById } from '@/services/cosmeticsService';
import { useGrowthStore } from '@/stores/growthStore';

/**
 * Revive wellness palette. Mirrors the `revive` colors in tailwind.config.js
 * for the places className can't reach (gradients, animated styles, icons).
 */
export const reviveColors = {
  light: {
    bg: '#F7FAF7',
    card: '#FFFFFF',
    primary: '#3A8D6D',
    secondary: '#A8D5BA',
    ink: '#17201C',
    muted: '#6B7280',
    mist: '#EAF3ED',
    storm: '#5E7C91',
    stormChip: '#E9F0F4',
  },
  dark: {
    bg: '#101714',
    card: '#18221D',
    primary: '#65B98A',
    secondary: '#A8D5BA',
    ink: '#E9F2EC',
    muted: '#9BAAA0',
    mist: '#1F2B25',
    storm: '#96B1C4',
    stormChip: '#1E2A32',
  },
} as const;

/**
 * Reads the light/dark palette, then applies the equipped App Theme's accent
 * over `primary` if the user has unlocked and equipped one — this is the
 * scoped app-theme effect: the handful of components that read color
 * dynamically from this hook re-tint, rather than every NativeWind className
 * app-wide being re-skinned.
 */
export function useReviveColors() {
  const scheme = useColorScheme();
  const base = reviveColors[scheme === 'dark' ? 'dark' : 'light'];
  const equippedTheme = useGrowthStore((s) => s.equippedCosmetics.app_theme);
  const accent = cosmeticById(equippedTheme)?.accentColor;
  if (!accent || equippedTheme === 'theme_default') return base;
  return { ...base, primary: accent };
}

/** Soft, expensive-feeling card shadow (barely-there on purpose). */
export const cardShadow = {
  boxShadow: '0px 6px 16px rgba(26, 58, 44, 0.08)',
} as const;
