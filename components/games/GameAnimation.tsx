import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const LEAVES = ['🌿', '🍃', '🌱', '🌿', '🍃'];
const SPARKLES = ['✨', '⭐', '✨'];

type GameAnimationProps = {
  /** Adds a couple of sparkles alongside the leaves for bigger moments (level-up). */
  celebrate?: boolean;
};

function FloatingParticle({ symbol, dx, delay }: { symbol: string; dx: number; delay: number }) {
  const y = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withSequence(withTiming(1, { duration: 250 }), withDelay(900, withTiming(0, { duration: 400 }))),
    );
    y.value = withDelay(delay, withTiming(-140, { duration: 1500, easing: Easing.out(Easing.cubic) }));
  }, [delay, opacity, y]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: y.value }, { translateX: dx }],
  }));

  return (
    <Animated.Text style={[style, { position: 'absolute', top: 40, fontSize: 26 }]}>
      {symbol}
    </Animated.Text>
  );
}

/**
 * Shared minimal celebration effect — floating leaves (and a light sparkle
 * accent on bigger moments). Deliberately restrained: no loud confetti burst,
 * this is a wellness app, not a slot machine.
 */
export default function GameAnimation({ celebrate = false }: GameAnimationProps) {
  const symbols = celebrate ? [...LEAVES, ...SPARKLES] : LEAVES;

  return (
    <View pointerEvents="none" className="absolute inset-0 items-center">
      {symbols.map((symbol, i) => {
        const dx = (i - (symbols.length - 1) / 2) * 30;
        return <FloatingParticle key={i} symbol={symbol} dx={dx} delay={i * 90} />;
      })}
    </View>
  );
}
