import * as Haptics from 'expo-haptics';
import Bot from 'lucide-react-native/icons/bot';
import CalendarDays from 'lucide-react-native/icons/calendar-days';
import House from 'lucide-react-native/icons/house';
import Settings from 'lucide-react-native/icons/settings';
import Users from 'lucide-react-native/icons/users';
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { runOnJS, useSharedValue, withSpring, type SharedValue } from 'react-native-reanimated';

import { CAPSULE_TAP_SPRING } from '@/animations/navigationAnimations';
import { TAB_ORDER, type TabKey } from '@/constants/navigation';
import type { NavIconComponent } from '@/components/navigation/AnimatedTabIcon';

export interface TabConfig {
  key: TabKey;
  label: string;
  Icon: NavIconComponent;
}

export const TAB_CONFIG: TabConfig[] = [
  { key: 'dashboard', label: 'Dashboard', Icon: House },
  { key: 'journey', label: 'Journey', Icon: CalendarDays },
  { key: 'coach', label: 'Coach', Icon: Bot },
  { key: 'community', label: 'Community', Icon: Users },
  { key: 'settings', label: 'Settings', Icon: Settings },
];

export function tabIndex(key: TabKey): number {
  return TAB_ORDER.indexOf(key);
}

interface MainNavigationContextValue {
  tabs: TabConfig[];
  /** JS-thread mirror of the current page, for anything that needs a re-render (not animation). */
  activeIndex: number;
  /** UI-thread continuous position — activeIndex during a settled state, a fractional value mid-drag. Read this to drive any animation. */
  progress: SharedValue<number>;
  /** Imperatively jump to a tab (tap, or cross-screen navigation like "Talk to Coach"). Animates + fires the landing haptic itself. */
  goToIndex: (index: number) => void;
  goToTab: (key: TabKey) => void;
  /**
   * Marks `index` as the settled page (JS-thread state + landing haptic) —
   * called once a page's own settle animation finishes. SwipePager's gesture
   * calls this directly (it already owns `progress` during a drag); taps go
   * through `goToIndex`, which springs `progress` and then calls this.
   */
  commit: (index: number) => void;
}

const MainNavigationContext = createContext<MainNavigationContextValue | null>(null);

export function MainNavigationProvider({ children }: { children: React.ReactNode }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  const progress = useSharedValue(0);

  // The single place a tab change is "committed" — called only once a page's
  // settle animation has actually finished (by SwipePager after a drag, or
  // by goToIndex's spring callback after a tap). Haptics fire here and only
  // here, so they can never fire mid-drag.
  const commit = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(TAB_CONFIG.length - 1, index));
    if (activeIndexRef.current !== clamped) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    activeIndexRef.current = clamped;
    setActiveIndex(clamped);
  }, []);

  const goToIndex = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(TAB_CONFIG.length - 1, index));
      if (clamped === activeIndexRef.current) return;
      progress.value = withSpring(clamped, CAPSULE_TAP_SPRING, (finished) => {
        if (finished) runOnJS(commit)(clamped);
      });
    },
    [progress, commit],
  );

  const goToTab = useCallback((key: TabKey) => goToIndex(tabIndex(key)), [goToIndex]);

  const value = useMemo<MainNavigationContextValue>(
    () => ({ tabs: TAB_CONFIG, activeIndex, progress, goToIndex, goToTab, commit }),
    [activeIndex, progress, goToIndex, goToTab, commit],
  );

  return (
    <MainNavigationContext.Provider value={value}>{children}</MainNavigationContext.Provider>
  );
}

export function useMainNavigation(): MainNavigationContextValue {
  const ctx = useContext(MainNavigationContext);
  if (!ctx) {
    throw new Error('useMainNavigation must be used within MainNavigationProvider');
  }
  return ctx;
}
