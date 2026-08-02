import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';

type FloatingIndicatorProps = {
  /** Already-animated (withSpring) position/size — this component just reads them. */
  x: SharedValue<number>;
  width: SharedValue<number>;
  color: string;
};

/**
 * The rounded capsule that lives behind the active tab. Position and width
 * are driven externally (by BottomNavigation, at the moment the active tab
 * changes) — this component is purely presentational so it never fights over
 * who owns the animation.
 */
export default function FloatingIndicator({ x, width, color }: FloatingIndicatorProps) {
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
    width: width.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          top: 6,
          bottom: 6,
          left: 0,
          borderRadius: 999,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}
