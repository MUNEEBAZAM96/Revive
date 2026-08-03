/**
 * Single source of truth for the floating bottom dock's geometry. Both
 * `BottomNavigation.tsx` (drawing it) and `useBottomNavClearance` (telling
 * every screen how much bottom padding to reserve) read from here, so the
 * two can never drift out of sync.
 */
export const NAV_BAR_HEIGHT = 62;
export const NAV_BAR_RADIUS = 30;
export const NAV_FLOAT_GAP = 12;
