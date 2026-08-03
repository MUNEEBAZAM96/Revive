import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NAV_BAR_HEIGHT, NAV_FLOAT_GAP } from '@/constants/navigation';
import { SPACING } from '@/constants/spacing';

/**
 * How much bottom padding a screen's scrollable content needs to fully clear
 * the floating dock. The dock is rendered `position: absolute` by React
 * Navigation's custom `tabBar`, so it does NOT reserve layout space the way
 * the default tab bar would — every scrollable tab screen must add this
 * padding itself, or its last items end up hidden underneath the dock.
 */
export function useBottomNavClearance(): number {
  const insets = useSafeAreaInsets();
  return insets.bottom + NAV_FLOAT_GAP + NAV_BAR_HEIGHT + SPACING.lg;
}
