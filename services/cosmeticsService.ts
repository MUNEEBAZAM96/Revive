import type { AchievementId } from './achievementsService';
import { ACHIEVEMENTS } from './achievementsService';

/**
 * Cosmetic catalog. Diamonds unlock Garden Themes, Profile Frames, and App
 * Themes; Achievement Badges are earned for free the moment their achievement
 * unlocks (gating a badge behind ANOTHER diamond cost on top of earning the
 * achievement would be redundant). Scope note: "App Theme" re-tints the
 * handful of components that already read color dynamically (progress rings,
 * level pill, support bubble, tree halo) — not a full re-skin of every
 * NativeWind className in the app.
 */

export type CosmeticCategory = 'garden_theme' | 'profile_frame' | 'app_theme' | 'badge';

export interface CosmeticItem {
  id: string;
  category: CosmeticCategory;
  name: string;
  diamondCost: number;
  /** For badges: which achievement grants this item for free. */
  achievementId?: AchievementId;
  /** Garden theme: tint for the TreeEvolution halo/background. */
  haloColor?: string;
  /** Profile frame: border color around the header avatar. */
  frameColor?: string;
  /** App theme: accent color for the dynamically-colored elements. */
  accentColor?: string;
}

export const GARDEN_THEMES: CosmeticItem[] = [
  { id: 'garden_default', category: 'garden_theme', name: 'Sage Garden', diamondCost: 0, haloColor: '#A8D5BA' },
  { id: 'garden_sunset', category: 'garden_theme', name: 'Sunset Garden', diamondCost: 15, haloColor: '#F4D98C' },
  { id: 'garden_moonlight', category: 'garden_theme', name: 'Moonlight Garden', diamondCost: 20, haloColor: '#8FAFC7' },
  { id: 'garden_blossom', category: 'garden_theme', name: 'Blossom Garden', diamondCost: 20, haloColor: '#F2A0B5' },
];

export const PROFILE_FRAMES: CosmeticItem[] = [
  { id: 'frame_none', category: 'profile_frame', name: 'No Frame', diamondCost: 0, frameColor: 'transparent' },
  { id: 'frame_gold', category: 'profile_frame', name: 'Gold Frame', diamondCost: 25, frameColor: '#D4A94A' },
  { id: 'frame_emerald', category: 'profile_frame', name: 'Emerald Frame', diamondCost: 20, frameColor: '#3A8D6D' },
  { id: 'frame_rose', category: 'profile_frame', name: 'Rose Frame', diamondCost: 20, frameColor: '#F2617D' },
];

export const APP_THEMES: CosmeticItem[] = [
  { id: 'theme_default', category: 'app_theme', name: 'Forest', diamondCost: 0, accentColor: '#3A8D6D' },
  { id: 'theme_ocean', category: 'app_theme', name: 'Ocean', diamondCost: 30, accentColor: '#3E7CB1' },
  { id: 'theme_sunset', category: 'app_theme', name: 'Sunset', diamondCost: 30, accentColor: '#D98B47' },
  { id: 'theme_rose', category: 'app_theme', name: 'Rose', diamondCost: 30, accentColor: '#D1567B' },
];

export const BADGE_ITEMS: CosmeticItem[] = ACHIEVEMENTS.map((a) => ({
  id: `badge_${a.id}`,
  category: 'badge',
  name: a.title,
  diamondCost: 0,
  achievementId: a.id,
}));

export const COSMETIC_CATALOG: CosmeticItem[] = [
  ...GARDEN_THEMES,
  ...PROFILE_FRAMES,
  ...APP_THEMES,
  ...BADGE_ITEMS,
];

/** Cosmetic ids granted for free from the start. */
export const DEFAULT_UNLOCKED_COSMETICS = ['garden_default', 'frame_none', 'theme_default'];

export function cosmeticById(id: string): CosmeticItem | undefined {
  return COSMETIC_CATALOG.find((c) => c.id === id);
}

export function itemsInCategory(category: CosmeticCategory): CosmeticItem[] {
  return COSMETIC_CATALOG.filter((c) => c.category === category);
}
