import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
// Deep per-icon imports — importing named exports from the main
// `lucide-react-native` barrel pulls the entire ~1600-icon library into the
// bundle under Metro (verified: it added ~1.9MB for 5 icons). Each icon has
// its own module under `lucide-react-native/icons/*`, so importing only that
// keeps the bundle to just what's used.
import Bot from 'lucide-react-native/icons/bot';
import Calendar from 'lucide-react-native/icons/calendar';
import House from 'lucide-react-native/icons/house';
import Settings from 'lucide-react-native/icons/settings';
import Users from 'lucide-react-native/icons/users';

import type { NavIconComponent } from '@/components/navigation/AnimatedIcon';

export interface NavRouteConfig {
  label: string;
  Icon: NavIconComponent;
}

/** Route name → label/icon. One icon family (Lucide) throughout the dock. */
const ROUTE_CONFIG: Record<string, NavRouteConfig> = {
  dashboard: { label: 'Dashboard', Icon: House },
  journey: { label: 'Journey', Icon: Calendar },
  coach: { label: 'Coach', Icon: Bot },
  community: { label: 'Community', Icon: Users },
  settings: { label: 'Settings', Icon: Settings },
};

export function routeConfigFor(routeName: string): NavRouteConfig {
  return ROUTE_CONFIG[routeName] ?? { label: routeName, Icon: House };
}

type NavigationSlice = Pick<BottomTabBarProps, 'state' | 'navigation'>;

/**
 * The "connect to React Navigation" logic, kept out of the presentational
 * dock components. Standard tabPress emit/prevent-default idiom, plus a
 * single light haptic fired only when the tab actually changes.
 */
export function useBottomNavigation({ state, navigation }: NavigationSlice) {
  const handlePress = (routeKey: string, routeName: string, index: number) => {
    const isFocused = state.index === index;
    const event = navigation.emit({
      type: 'tabPress',
      target: routeKey,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      navigation.navigate(routeName);
    }
  };

  return { handlePress };
}
