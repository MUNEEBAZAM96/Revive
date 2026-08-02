import { memo, useEffect } from 'react';
import { LayoutChangeEvent, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { COLOR_TRANSITION, PRESS_SPRING } from '@/animations/navigationAnimations';

import AnimatedIcon, { NavIconComponent } from './AnimatedIcon';

type BottomNavigationItemProps = {
  label: string;
  Icon: NavIconComponent;
  active: boolean;
  activeColor: string;
  inactiveColor: string;
  onPress: () => void;
  onLayout: (x: number, width: number) => void;
};

/**
 * One dock item: icon only (no visible label) — `label` is still passed
 * through to `accessibilityLabel` so VoiceOver/TalkBack announce the tab
 * name even though it's not drawn. `progress` drives the icon's color
 * crossfade; an independent shared value handles the light press-scale.
 * Touch target is kept to at least 44×44 regardless of visual size.
 */
function BottomNavigationItem({
  label,
  Icon,
  active,
  activeColor,
  inactiveColor,
  onPress,
  onLayout,
}: BottomNavigationItemProps) {
  const progress = useSharedValue(active ? 1 : 0);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, COLOR_TRANSITION);
  }, [active, progress]);

  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: pressScale.value }] }));

  const handlePressIn = () => {
    pressScale.value = withSpring(0.96, PRESS_SPRING);
  };
  const handlePressOut = () => {
    pressScale.value = withSpring(1, PRESS_SPRING);
  };
  const handleLayout = (event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    onLayout(x, width);
  };

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onLayout={handleLayout}
      hitSlop={6}
      className="flex-1 items-center justify-center"
      style={{ minHeight: 44, minWidth: 44 }}>
      <Animated.View style={pressStyle} className="items-center justify-center px-3 py-2.5">
        <AnimatedIcon
          Icon={Icon}
          active={active}
          progress={progress}
          size={23}
          activeColor={activeColor}
          inactiveColor={inactiveColor}
        />
      </Animated.View>
    </Pressable>
  );
}

export default memo(BottomNavigationItem);
