import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

import { ICON_SELECT_SPRING } from '@/animations/navigationAnimations';

export type NavIconComponent = React.ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;

type AnimatedIconProps = {
  Icon: NavIconComponent;
  /** True exactly when this tab is the selected one — drives the one-shot pop. */
  active: boolean;
  /** 0 = inactive, 1 = active — drives the color crossfade (same value as the label). */
  progress: SharedValue<number>;
  size?: number;
  activeColor: string;
  inactiveColor: string;
};

/**
 * Icon "color change" is really a crossfade between two stacked icon layers
 * (inactive gray, active green) — lucide icons don't expose an animatable SVG
 * prop, so this is the smooth, worklet-only way to avoid a hard color snap.
 * A separate one-shot scale (1 → 1.08 → 1) pops on selection only, then
 * settles back — never a sustained enlargement.
 */
export default function AnimatedIcon({
  Icon,
  active,
  progress,
  size = 22,
  activeColor,
  inactiveColor,
}: AnimatedIconProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (active) {
      scale.value = withSequence(
        withSpring(1.08, ICON_SELECT_SPRING),
        withSpring(1, ICON_SELECT_SPRING),
      );
    }
  }, [active, scale]);

  const wrapperStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const activeLayerStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const inactiveLayerStyle = useAnimatedStyle(() => ({ opacity: 1 - progress.value }));

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
