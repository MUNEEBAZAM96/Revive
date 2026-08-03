import { View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

export type NavIconComponent = React.ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;

type AnimatedTabIconProps = {
  Icon: NavIconComponent;
  /** This tab's index in TAB_ORDER — compared against `progress` to derive continuous "how active am I" (0..1), so it tracks a live swipe rather than snapping. */
  index: number;
  progress: SharedValue<number>;
  size?: number;
  activeColor: string;
  inactiveColor: string;
};

/**
 * The icon "color change" is a crossfade between two stacked icon layers
 * (lucide icons don't expose an animatable stroke-color prop), scaling
 * continuously from 1 → 1.12 as this tab becomes active — driven directly by
 * the pager's live `progress`, so it tracks a mid-swipe finger position
 * exactly as smoothly as a completed tap, with no separate spring needed.
 */
export default function AnimatedTabIcon({
  Icon,
  index,
  progress,
  size = 22,
  activeColor,
  inactiveColor,
}: AnimatedTabIconProps) {
  const wrapperStyle = useAnimatedStyle(() => {
    const activeness = interpolate(progress.value, [index - 1, index, index + 1], [0, 1, 0], 'clamp');
    return { transform: [{ scale: 1 + activeness * 0.12 }] };
  });
  const activeLayerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [index - 1, index, index + 1], [0, 1, 0], 'clamp'),
  }));
  const inactiveLayerStyle = useAnimatedStyle(() => ({
    opacity: 1 - interpolate(progress.value, [index - 1, index, index + 1], [0, 1, 0], 'clamp'),
  }));

  return (
    <Animated.View style={wrapperStyle}>
      <View style={{ width: size, height: size }}>
        <Animated.View style={[{ position: 'absolute' }, inactiveLayerStyle]}>
          <Icon size={size} color={inactiveColor} strokeWidth={2} />
        </Animated.View>
        <Animated.View style={activeLayerStyle}>
          <Icon size={size} color={activeColor} strokeWidth={2} />
        </Animated.View>
      </View>
    </Animated.View>
  );
}
