import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useEffect, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import SupportBottomSheet from './SupportBottomSheet';

const STORAGE_KEY = 'support.bubble.pos';
const SIZE = 60;
const MARGIN = 16;
// Clearance for the floating dock (70px bar + 24px float gap), plus a little
// breathing room so the bubble never sits flush against it.
const TAB_BAR = 100;
// A caring rose/pink — warmer and more "I'm here for you" than the brand green.
const BUBBLE_COLOR = '#F2617D';
const BUBBLE_HALO = 'rgba(242, 97, 125, 0.20)';
const BUBBLE_GLOW = '0px 6px 16px rgba(242, 97, 125, 0.45)';

function clamp(value: number, min: number, max: number): number {
  'worklet';
  return Math.min(Math.max(value, min), max);
}

/**
 * Revive's signature support feature: a compact, heart-shaped bubble that
 * floats above the tab bar, can be dragged anywhere, springs to the nearest
 * edge, and remembers where it was left. A soft heart (not an alarm) keeps
 * asking for help feeling safe. Tapping (without dragging) opens the sheet.
 */
export default function DraggableSupportBubble() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  const minX = MARGIN;
  const maxX = width - SIZE - MARGIN;
  const minY = insets.top + MARGIN;
  const maxY = height - insets.bottom - TAB_BAR - SIZE;

  // Default: bottom-right.
  const tx = useSharedValue(maxX);
  const ty = useSharedValue(maxY);
  const start = useSharedValue({ x: maxX, y: maxY });
  const pulse = useSharedValue(1);

  // Gentle breathing pulse.
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
    );
  }, [pulse]);

  // Restore the saved position.
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (!saved) return;
        const { x, y } = JSON.parse(saved) as { x: number; y: number };
        tx.value = clamp(x, minX, maxX);
        ty.value = clamp(y, minY, maxY);
      } catch {
        /* keep default */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = (x: number, y: number) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ x, y })).catch(() => {});
  };

  const pan = Gesture.Pan()
    .onStart(() => {
      start.value = { x: tx.value, y: ty.value };
    })
    .onUpdate((e) => {
      tx.value = clamp(start.value.x + e.translationX, minX, maxX);
      ty.value = clamp(start.value.y + e.translationY, minY, maxY);
    })
    .onEnd(() => {
      // Snap to whichever horizontal edge is closer.
      const snapX = tx.value + SIZE / 2 < width / 2 ? minX : maxX;
      tx.value = withSpring(snapX, { damping: 15, stiffness: 140 });
      runOnJS(persist)(snapX, ty.value);
    });

  const tap = Gesture.Tap().onEnd(() => {
    runOnJS(setOpen)(true);
  });

  const gesture = Gesture.Race(pan, tap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: pulse.value }],
  }));

  return (
    <>
      <GestureDetector gesture={gesture}>
        <Animated.View
          style={[
            animatedStyle,
            {
              position: 'absolute',
              left: 0,
              top: 0,
              width: SIZE,
              height: SIZE,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="I need support. Draggable.">
          {/* Faint halo ring — purely decorative, no shadow of its own so it
              can never paint a background box on Android. */}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: -6,
              left: -6,
              right: -6,
              bottom: -6,
              borderRadius: (SIZE + 12) / 2,
              backgroundColor: BUBBLE_HALO,
            }}
          />
          {/* The glow/shadow lives ONLY on this circular, opaque view — on
              Android a shadow needs a matching borderRadius + backgroundColor
              on the exact same view, or it renders as a plain white square. */}
          <View
            style={{
              width: SIZE,
              height: SIZE,
              borderRadius: SIZE / 2,
              backgroundColor: BUBBLE_COLOR,
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: BUBBLE_GLOW,
            }}>
            <FontAwesome name="heart" size={22} color="#ffffff" />
          </View>
        </Animated.View>
      </GestureDetector>

      <SupportBottomSheet visible={open} onClose={() => setOpen(false)} />
    </>
  );
}
