/**
 * The single spacing scale for the app. Every margin/padding/gap should pull
 * from here — no ad-hoc numbers. Mirrors NativeWind's default scale (4px
 * step = 1 unit) so `SPACING.md` (16) and `className="p-4"` are the same
 * value; use the constant when a numeric style prop is required (e.g. a
 * dynamic `paddingBottom`) and the `className` when it's static.
 */
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
} as const;

export type SpacingKey = keyof typeof SPACING;
