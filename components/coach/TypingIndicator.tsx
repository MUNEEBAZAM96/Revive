import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

function Dot({ delay }: { delay: number }) {
  const lift = useSharedValue(0);

  useEffect(() => {
    lift.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-4, { duration: 320, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 320, easing: Easing.in(Easing.quad) }),
        ),
        -1,
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: lift.value }] }));

  return (
    <Animated.View
      style={style}
      className="h-1.5 w-1.5 rounded-full bg-revive-muted dark:bg-revive-muted-dark"
    />
  );
}

/** Three-dot "the coach is composing a reply" indicator, shown before streaming starts. */
export default function TypingIndicator() {
  return (
    <View className="mb-1 max-w-[60%] flex-row items-center gap-1.5 self-start rounded-3xl rounded-bl-md bg-revive-card px-4 py-3.5 dark:bg-revive-card-dark">
      <Dot delay={0} />
      <Dot delay={120} />
      <Dot delay={240} />
    </View>
  );
}
