import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import {
  buildReactionPrompts,
  Difficulty,
  GameResult,
  reactionFocusConfig,
} from '@/services/gameEngine';

type ReactionFocusGameProps = {
  reward: number;
  difficulty: Difficulty;
  onComplete: (result: GameResult) => void;
};

/**
 * Reaction Focus — attention training. Tap only the green circle; let red
 * pass. Each prompt auto-advances after a short window, so hesitating on a
 * distractor is itself the correct move.
 */
export default function ReactionFocusGame({ reward, difficulty, onComplete }: ReactionFocusGameProps) {
  const config = useMemo(() => reactionFocusConfig(difficulty), [difficulty]);
  const prompts = useMemo(() => buildReactionPrompts(config), [config]);
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [flash, setFlash] = useState<'good' | 'miss' | null>(null);
  const started = useMemo(() => Date.now(), []);
  const advancedRef = useRef(false);

  const finish = (finalCorrect: number) => {
    onComplete({
      gameType: 'reaction_focus',
      score: finalCorrect,
      reward,
      durationSec: Math.round((Date.now() - started) / 1000),
    });
  };

  const advance = (correctThisRound: boolean) => {
    if (advancedRef.current) return;
    advancedRef.current = true;
    const nextCorrectCount = correctCount + (correctThisRound ? 1 : 0);
    setCorrectCount(nextCorrectCount);
    setFlash(correctThisRound ? 'good' : 'miss');
    setTimeout(() => {
      setFlash(null);
      if (index + 1 >= prompts.length) {
        finish(nextCorrectCount);
      } else {
        setIndex((i) => i + 1);
      }
    }, 350);
  };

  useEffect(() => {
    advancedRef.current = false;
    const isGreen = prompts[index];
    const timer = setTimeout(() => {
      // Time ran out: correct only if this was a red (nothing to tap).
      advance(!isGreen);
    }, config.showMs);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const isGreen = prompts[index];

  const tap = () => {
    // Tapping is correct only on green.
    advance(isGreen);
  };

  return (
    <View className="items-center py-2">
      <Text className="text-[13px] font-semibold uppercase tracking-wider text-revive-primary dark:text-revive-primary-dark">
        Prompt {index + 1} of {prompts.length}
      </Text>
      <Text className="mt-2 text-center text-base text-revive-muted dark:text-revive-muted-dark">
        Tap only the green circle. Let red pass.
      </Text>

      <View className="mt-10 h-40 w-40 items-center justify-center">
        <Animated.View key={index} entering={FadeIn.duration(150)}>
          <Pressable
            accessibilityRole="button"
            onPress={tap}
            className="h-32 w-32 items-center justify-center rounded-full active:scale-95"
            style={{ backgroundColor: isGreen ? '#3A8D6D' : '#D1567B' }}>
            {flash && (
              <Text className="text-3xl">{flash === 'good' ? '✓' : '✕'}</Text>
            )}
          </Pressable>
        </Animated.View>
      </View>

      <Text className="mt-8 text-[13px] text-revive-muted dark:text-revive-muted-dark">
        {correctCount} correct so far
      </Text>
    </View>
  );
}
