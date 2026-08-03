import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

export type TabLayout = { x: number; width: number };

type TabIndicatorProps = {
  /** The pager's live continuous position — the capsule blends between the two nearest tabs' measured layouts using its fractional part, so it moves in lockstep with a drag, not just after a tap settles. */
  progress: SharedValue<number>;
  layouts: SharedValue<TabLayout[]>;
  count: number;
  color: string;
};

/**
 * The rounded capsule behind the active tab. Tab labels differ in width
 * ("Dashboard" vs "Coach"), so the capsule can't just translate — it
 * interpolates both position AND width between its two nearest neighbors.
 */
export default function TabIndicator({ progress, layouts, count, color }: TabIndicatorProps) {
  const style = useAnimatedStyle(() => {
    const clamped = Math.max(0, Math.min(count - 1, progress.value));
    const i0 = Math.floor(clamped);
    const i1 = Math.min(i0 + 1, count - 1);
    const t = clamped - i0;

    const a = layouts.value[i0] ?? { x: 0, width: 0 };
    const b = layouts.value[i1] ?? a;

    return {
      transform: [{ translateX: a.x + (b.x - a.x) * t }],
      width: a.width + (b.width - a.width) * t,
    };
  });

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
