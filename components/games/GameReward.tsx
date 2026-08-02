import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

type GameRewardProps = {
  icon: '🌿' | '💎';
  amount: number;
  /** Static (used inline on a GameCard) vs a pop-in scale (used on GameResult). */
  animated?: boolean;
  delay?: number;
};

/** A small "+20 🌿" / "+5 💎" reward chip, reused across cards and results. */
export default function GameReward({ icon, amount, animated = false, delay = 0 }: GameRewardProps) {
  const scale = useSharedValue(animated ? 0 : 1);

  useEffect(() => {
    if (!animated) return;
    const timer = setTimeout(() => {
      scale.value = withSpring(1, { damping: 10, stiffness: 180 });
    }, delay);
    return () => clearTimeout(timer);
  }, [animated, delay, scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const isScore = icon === '🌿';

  return (
    <Animated.View
      style={animated ? style : undefined}
      className={`flex-row items-center rounded-full px-3 py-1.5 ${
        isScore
          ? 'bg-revive-secondary/30 dark:bg-revive-primary-dark/20'
          : 'bg-[#F2617D1A]'
      }`}>
      <Text className="text-sm">{icon}</Text>
      <Text
        className={`ml-1 text-[13px] font-bold ${
          isScore ? 'text-revive-primary dark:text-revive-primary-dark' : 'text-[#F2617D]'
        }`}>
        +{amount}
      </Text>
    </Animated.View>
  );
}
