import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { routeConfigFor, useBottomNavigation } from '@/hooks/useBottomNavigation';

import BottomNavigation, { NavRoute } from './BottomNavigation';

/**
 * The "smart" half of the custom dock — this is what gets passed as
 * `<Tabs tabBar={...}>`. It only translates React Navigation's tab-bar props
 * into the presentational BottomNavigation's props; all visual/animation
 * logic lives there. (Named to mirror the suggested architecture — this is
 * Revive's own tab-bar host, not React Navigation's NavigationContainer.)
 */
export default function NavigationContainer({ state, navigation, insets }: BottomTabBarProps) {
  const { handlePress } = useBottomNavigation({ state, navigation });

  const routes: NavRoute[] = state.routes.map((route) => {
    const config = routeConfigFor(route.name);
    return { key: route.key, name: route.name, label: config.label, Icon: config.Icon };
  });

  return (
    <BottomNavigation
      routes={routes}
      activeIndex={state.index}
      bottomInset={insets.bottom}
      onPress={(route, index) => handlePress(route.key, route.name, index)}
    />
  );
}
