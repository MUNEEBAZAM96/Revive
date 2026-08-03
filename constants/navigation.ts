/**
 * Single source of truth for the floating bottom dock's geometry. Both
 * `PremiumBottomBar.tsx` (drawing it) and `useBottomNavClearance` (telling
 * every screen how much bottom padding to reserve) read from here, so the
 * two can never drift out of sync.
 *
 * Height grew from the old icon-only dock (62) to fit a label under each
 * icon per the swipeable-navigation redesign.
 */
export const NAV_BAR_HEIGHT = 68;
export const NAV_BAR_RADIUS = 30;
export const NAV_FLOAT_GAP = 12;

/** The five main tabs, in swipe order. Index in this array IS the pager index. */
export const TAB_ORDER = ['dashboard', 'journey', 'coach', 'community', 'settings'] as const;
export type TabKey = (typeof TAB_ORDER)[number];

export const TAB_COUNT = TAB_ORDER.length;

/**
 * How far (as a fraction of screen width) the user must drag before a
 * release commits to the next/previous page instead of springing back.
 * Paired with a velocity threshold so a fast flick commits even if the
 * finger didn't travel the full distance — matches native paging feel.
 */
export const SWIPE_COMMIT_DISTANCE_RATIO = 0.32;
export const SWIPE_COMMIT_VELOCITY = 700; // px/s

/** Rubber-band resistance applied when dragging past the first/last page. */
export const EDGE_RESISTANCE = 0.35;

/** How much the pan must move horizontally before the pager gesture activates, vs. failing to a vertical scroll inside the page. */
export const PAGER_ACTIVE_OFFSET_X = 12;
export const PAGER_FAIL_OFFSET_Y = 12;
