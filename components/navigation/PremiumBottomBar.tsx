import { BlurView } from 'expo-blur';
import { useCallback, useEffect } from 'react';
import {
  Keyboard,
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BAR_VISIBILITY_TIMING } from '@/animations/navigationAnimations';
import AnimatedTabIcon from '@/components/navigation/AnimatedTabIcon';
import { useMainNavigation } from '@/components/navigation/NavigationContext';
import TabIndicator, { type TabLayout } from '@/components/navigation/TabIndicator';
import { useReviveColors } from '@/components/dashboard/theme';
import { NAV_BAR_HEIGHT, NAV_BAR_RADIUS, NAV_FLOAT_GAP } from '@/constants/navigation';

const MAX_BAR_WIDTH = 460;

/**
 * The floating glass dock — rounded, blurred, shadowed, never touching the
 * screen edge. Reads tab state from `useMainNavigation()` instead of React
 * Navigation's tab-bar props (there is no tab navigator anymore — see
 * MainNavigator.tsx), so it works identically whether a tab change comes
 * from a tap here or a swipe anywhere on screen.
 */
export default function PremiumBottomBar() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = useReviveColors();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { tabs, progress, activeIndex, goToIndex } = useMainNavigation();

  const barWidth = Math.min(screenWidth * 0.9, MAX_BAR_WIDTH);
  const layouts = useSharedValue<TabLayout[]>(tabs.map(() => ({ x: 0, width: 0 })));

  const handleItemLayout = useCallback(
    (index: number, x: number, width: number) => {
      const current = layouts.value[index];
      if (current && current.x === x && current.width === width) return;
      const next = layouts.value.slice();
      next[index] = { x, width };
      layouts.value = next;
    },
    [layouts],
  );

  // Hide the dock while the keyboard is open (e.g. the Coach composer) — a
  // floating bar sitting on top of a keyboard reads as a bug, not polish.
  const hideProgress = useSharedValue(0);
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => {
      hideProgress.value = withTiming(1, BAR_VISIBILITY_TIMING);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      hideProgress.value = withTiming(0, BAR_VISIBILITY_TIMING);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [hideProgress]);

  const visibilityStyle = useAnimatedStyle(() => ({
    opacity: 1 - hideProgress.value,
    transform: [{ translateY: hideProgress.value * (NAV_BAR_HEIGHT + NAV_FLOAT_GAP) }],
  }));

  const indicatorColor = isDark ? 'rgba(58, 141, 109, 0.22)' : 'rgba(58, 141, 109, 0.12)';
  const tintColor = isDark ? 'rgba(20, 24, 22, 0.92)' : 'rgba(255, 255, 255, 0.88)';

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: insets.bottom + NAV_FLOAT_GAP,
          alignItems: 'center',
        },
        visibilityStyle,
      ]}>
      {/* Outer: shadow + rounded shape (Android needs an opaque-ish match here). */}
      <View
        style={{
          width: barWidth,
          height: NAV_BAR_HEIGHT,
          borderRadius: NAV_BAR_RADIUS,
          backgroundColor: isDark ? '#141816' : '#FFFFFF',
          boxShadow: isDark
            ? '0px 12px 28px rgba(0, 0, 0, 0.45)'
            : '0px 12px 28px rgba(26, 58, 44, 0.14)',
        }}>
        {/* Inner: blur + clip + content. */}
        <View style={{ flex: 1, borderRadius: NAV_BAR_RADIUS, overflow: 'hidden' }}>
          <BlurView
            intensity={isDark ? 45 : 65}
            tint={isDark ? 'dark' : 'light'}
            experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
            style={StyleSheet.absoluteFill}
          />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: tintColor }]} />

          <View className="flex-1 flex-row items-center px-2">
            <TabIndicator progress={progress} layouts={layouts} count={tabs.length} color={indicatorColor} />
            {tabs.map((tab, index) => (
              <TabBarButton
                key={tab.key}
                label={tab.label}
                Icon={tab.Icon}
                index={index}
                progress={progress}
                activeColor={colors.primary}
                inactiveColor={colors.muted}
                onPress={() => goToIndex(index)}
                onLayout={(x, width) => handleItemLayout(index, x, width)}
                accessibilitySelected={activeIndex === index}
              />
            ))}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

type TabBarButtonProps = {
  label: string;
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  index: number;
  progress: SharedValue<number>;
  activeColor: string;
  inactiveColor: string;
  onPress: () => void;
  onLayout: (x: number, width: number) => void;
  accessibilitySelected: boolean;
};

/** One dock item: icon + label, both continuously driven by the pager's live progress. */
function TabBarButton({
  label,
  Icon,
  index,
  progress,
  activeColor,
  inactiveColor,
  onPress,
  onLayout,
  accessibilitySelected,
}: TabBarButtonProps) {
  const labelStyle = useAnimatedStyle(() => {
    const activeness = interpolate(progress.value, [index - 1, index, index + 1], [0, 1, 0], 'clamp');
    return { opacity: 0.55 + activeness * 0.45 };
  });

  const handleLayout = (event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    onLayout(x, width);
  };

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: accessibilitySelected }}
      accessibilityLabel={label}
      onPress={onPress}
      onLayout={handleLayout}
      hitSlop={4}
      className="flex-1 items-center justify-center active:opacity-80"
      style={{ minHeight: 44, minWidth: 44 }}>
      <View className="items-center justify-center px-2 py-2">
        <AnimatedTabIcon
          Icon={Icon}
          index={index}
          progress={progress}
          size={22}
          activeColor={activeColor}
          inactiveColor={inactiveColor}
        />
        <Animated.Text
          style={labelStyle}
          className="mt-1 text-[11px] font-semibold text-revive-ink dark:text-revive-ink-dark">
          {label}
        </Animated.Text>
      </View>
    </Pressable>
  );
}
