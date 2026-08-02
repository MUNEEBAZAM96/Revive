import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Difficulty, GameResult, pauseSeconds } from '@/services/gameEngine';

type ImpulseControlGameProps = {
  reward: number;
  difficulty: Difficulty;
  onComplete: (result: GameResult) => void;
};

/**
 * Impulse Control — the pause. A breathing circle holds steady while a
 * countdown runs; the user practices waiting without acting. This is the
 * exact skill that turns an urge into a choice.
 */
export default function ImpulseControlGame({ reward, difficulty, onComplete }: ImpulseControlGameProps) {
  const totalSeconds = useMemo(() => pauseSeconds(difficulty), [difficulty]);
  const [remaining, setRemaining] = useState(totalSeconds);
  const [started, setStarted] = useState(false);
  const startedAt = useMemo(() => Date.now(), []);
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (!started) return;
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 1000, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
    );
  }, [started, pulse]);

  useEffect(() => {
    if (!started || remaining <= 0) return;
    const timer = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(timer);
  }, [started, remaining]);

  useEffect(() => {
    if (started && remaining === 0) {
      onComplete({
        gameType: 'impulse_control',
        score: totalSeconds,
        reward,
        durationSec: Math.round((Date.now() - startedAt) / 1000),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, started]);

  const circleStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  return (
    <View className="items-center py-2">
      <Text className="text-center text-lg font-semibold text-revive-ink dark:text-revive-ink-dark">
        Can you pause for {totalSeconds} seconds?
      </Text>
      <Text className="mt-2 text-center text-base text-revive-muted dark:text-revive-muted-dark">
        Just wait with it. Don&apos;t act — notice.
      </Text>

      <View className="mt-10 h-48 w-48 items-center justify-center">
        <Animated.View
          style={[
            circleStyle,
            {
              position: 'absolute',
              width: 180,
              height: 180,
              borderRadius: 90,
              backgroundColor: 'rgba(58, 141, 109, 0.14)',
            },
          ]}
        />
        <View className="h-32 w-32 items-center justify-center rounded-full bg-revive-primary dark:bg-revive-primary-dark">
          <Text className="text-5xl font-extrabold text-white">{remaining}</Text>
        </View>
      </View>

      {!started ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => setStarted(true)}
          className="mt-10 items-center rounded-2xl bg-revive-primary px-8 py-4 active:scale-95 dark:bg-revive-primary-dark">
          <Text className="text-base font-bold text-white dark:text-revive-bg-dark">
            Begin the pause
          </Text>
        </Pressable>
      ) : (
        <Text className="mt-10 text-[13px] text-revive-muted dark:text-revive-muted-dark">
          Stay with it. You&apos;re practicing control.
        </Text>
      )}
    </View>
  );
}
