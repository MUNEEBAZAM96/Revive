import { BlurView } from 'expo-blur';
import { useCallback, useEffect, useRef } from 'react';
import { Keyboard, Platform, StyleSheet, useColorScheme, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { BAR_VISIBILITY_TIMING, INDICATOR_SPRING } from '@/animations/navigationAnimations';

import type { NavIconComponent } from './AnimatedIcon';
import BottomNavigationItem from './BottomNavigationItem';
import FloatingIndicator from './FloatingIndicator';

export interface NavRoute {
  key: string;
  name: string;
  label: string;
  Icon: NavIconComponent;
}

type BottomNavigationProps = {
  routes: NavRoute[];
  activeIndex: number;
  onPress: (route: NavRoute, index: number) => void;
  /** Safe-area bottom inset — the dock floats this much further above it. */
  bottomInset: number;
};

const ACTIVE_COLOR = '#3A8D6D';
const INACTIVE_COLOR = '#8B949E';
const BAR_HEIGHT = 70;
const BAR_RADIUS = 34;
const FLOAT_GAP = 12;
const MAX_BAR_WIDTH = 460;

/**
 * The floating glass dock. Never touches the screen edge, never fills the
 * width on large screens (capped so it stays an intentional object, not a
 * stretched bar on tablets). Shadow lives on an OUTER opaque-ish view and the
 * blur/clip lives on an INNER view — on Android, `overflow: hidden` on the
 * same view as a shadow clips the shadow itself, so the two are split.
 */
export default function BottomNavigation({
  routes,
  activeIndex,
  onPress,
  bottomInset,
}: BottomNavigationProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const { width: screenWidth } = useWindowDimensions();

  const barWidth = Math.min(screenWidth * 0.9, MAX_BAR_WIDTH);

  const indicatorX = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);
  const layoutsRef = useRef<Record<number, { x: number; width: number }>>({});
  const hasMeasuredRef = useRef(false);

  const applyIndicator = useCallback(
    (index: number) => {
      const layout = layoutsRef.current[index];
      if (!layout) return;
      if (!hasMeasuredRef.current) {
        // First paint: snap into place, never spring in from the corner.
        indicatorX.value = layout.x;
        indicatorWidth.value = layout.width;
        hasMeasuredRef.current = true;
      } else {
        indicatorX.value = withSpring(layout.x, INDICATOR_SPRING);
        indicatorWidth.value = withSpring(layout.width, INDICATOR_SPRING);
      }
    },
    [indicatorX, indicatorWidth],
  );

  const handleItemLayout = useCallback(
    (index: number, x: number, width: number) => {
      layoutsRef.current[index] = { x, width };
      if (index === activeIndex) applyIndicator(index);
    },
    [activeIndex, applyIndicator],
  );

  useEffect(() => {
    applyIndicator(activeIndex);
  }, [activeIndex, applyIndicator]);

  // Hide the dock while the keyboard is open (e.g. the Coach message input) —
  // a floating bar sitting on top of a keyboard reads as a bug, not polish.
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
    transform: [{ translateY: hideProgress.value * (BAR_HEIGHT + FLOAT_GAP) }],
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
          bottom: bottomInset + FLOAT_GAP,
          alignItems: 'center',
        },
        visibilityStyle,
      ]}>
      {/* Outer: shadow + rounded shape (Android needs an opaque-ish match here). */}
      <View
        style={{
          width: barWidth,
          height: BAR_HEIGHT,
          borderRadius: BAR_RADIUS,
          backgroundColor: isDark ? '#141816' : '#FFFFFF',
          boxShadow: isDark
            ? '0px 12px 28px rgba(0, 0, 0, 0.45)'
            : '0px 12px 28px rgba(26, 58, 44, 0.14)',
        }}>
        {/* Inner: blur + clip + content. */}
        <View style={{ flex: 1, borderRadius: BAR_RADIUS, overflow: 'hidden' }}>
          <BlurView
            intensity={isDark ? 45 : 65}
            tint={isDark ? 'dark' : 'light'}
            experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
            style={StyleSheet.absoluteFill}
          />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: tintColor }]} />

          <View className="flex-1 flex-row items-center px-2">
            <FloatingIndicator x={indicatorX} width={indicatorWidth} color={indicatorColor} />
            {routes.map((route, index) => (
              <BottomNavigationItem
                key={route.key}
                label={route.label}
                Icon={route.Icon}
                active={index === activeIndex}
                activeColor={ACTIVE_COLOR}
                inactiveColor={INACTIVE_COLOR}
                onPress={() => onPress(route, index)}
                onLayout={(x, width) => handleItemLayout(index, x, width)}
              />
            ))}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}
