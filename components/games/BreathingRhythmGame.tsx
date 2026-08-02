import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { BREATH_PHASES, breathTarget, Difficulty, GameResult } from '@/services/gameEngine';

type BreathingRhythmGameProps = {
  reward: number;
  difficulty: Difficulty;
  onComplete: (result: GameResult) => void;
};

/**
 * Breathing Rhythm — emotional regulation training. A steady expand-hold-
 * contract cycle, the same paced-breathing pattern used for nervous-system
 * regulation. Breath target scales gently with difficulty.
 */
export default function BreathingRhythmGame({ reward, difficulty, onComplete }: BreathingRhythmGameProps) {
  const target = useMemo(() => breathTarget(difficulty), [difficulty]);
  const scale = useSharedValue(1);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [breaths, setBreaths] = useState(0);
  const started = useMemo(() => Date.now(), []);

  useEffect(() => {
    if (breaths >= target) {
      onComplete({
        gameType: 'breathing_rhythm',
        score: target,
        reward,
        durationSec: Math.round((Date.now() - started) / 1000),
      });
      return;
    }

    const phase = BREATH_PHASES[phaseIndex];
    scale.value = withTiming(phase.target, {
      duration: phase.duration,
      easing: Easing.inOut(Easing.ease),
    });
    const timer = setTimeout(() => {
      if (phase.key === 'out') setBreaths((b) => b + 1);
      setPhaseIndex((i) => (i + 1) % BREATH_PHASES.length);
    }, phase.duration);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseIndex, breaths]);

  const orbStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const phase = BREATH_PHASES[phaseIndex];

  return (
    <View className="items-center py-2">
      <Text className="text-center text-base text-revive-muted dark:text-revive-muted-dark">
        Follow the circle. Let your breath settle.
      </Text>

      <View className="mt-8 h-56 w-56 items-center justify-center">
        <Animated.View
          style={[
            orbStyle,
            {
              position: 'absolute',
              width: 170,
              height: 170,
              borderRadius: 85,
              backgroundColor: 'rgba(58, 141, 109, 0.16)',
            },
          ]}
        />
        <Animated.View
          style={[
            orbStyle,
            {
              position: 'absolute',
              width: 110,
              height: 110,
              borderRadius: 55,
              backgroundColor: '#3A8D6D',
            },
          ]}
        />
        <View className="items-center">
          <Text className="text-xl font-bold text-revive-ink dark:text-revive-ink-dark">
            {phase.label}
          </Text>
        </View>
      </View>

      <Text className="mt-8 text-[13px] text-revive-muted dark:text-revive-muted-dark">
        {breaths} of {target} calming breaths
      </Text>
    </View>
  );
}
