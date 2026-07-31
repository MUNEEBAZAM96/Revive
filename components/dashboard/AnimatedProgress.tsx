import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { useReviveColors } from './theme';

type AnimatedProgressProps = {
  /** 0..1 */
  progress: number;
  delay?: number;
  height?: number;
};

/** Rounded progress bar that gently fills in when it appears. */
export default function AnimatedProgress({
  progress,
  delay = 400,
  height = 8,
}: AnimatedProgressProps) {
  const colors = useReviveColors();
  const fill = useSharedValue(0);

  useEffect(() => {
    fill.value = withDelay(
      delay,
      withTiming(Math.min(Math.max(progress, 0), 1), {
        duration: 1100,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [progress, delay, fill]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${fill.value * 100}%`,
  }));

  return (
    <View
      className="w-full overflow-hidden rounded-full bg-revive-mist dark:bg-revive-mist-dark"
      style={{ height }}>
      <Animated.View
        style={[fillStyle, { height, borderRadius: height / 2, backgroundColor: colors.primary }]}
      />
    </View>
  );
}
