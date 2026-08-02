import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import {
  buildPatternRound,
  Difficulty,
  GameResult,
  PatternRound,
  patternMatchRounds,
} from '@/services/gameEngine';

type PatternMatchGameProps = {
  reward: number;
  difficulty: Difficulty;
  onComplete: (result: GameResult) => void;
};

/**
 * Pattern Match — mindfulness training. A calming symbol appears; find its
 * match among a few gentle options. Slows the mind down to a single point
 * of focus.
 */
export default function PatternMatchGame({ reward, difficulty, onComplete }: PatternMatchGameProps) {
  const config = useMemo(() => patternMatchRounds(difficulty), [difficulty]);
  const [round, setRound] = useState(0);
  const [pattern, setPattern] = useState<PatternRound>(() => buildPatternRound(config.options));
  const [feedback, setFeedback] = useState<'correct' | null>(null);
  const started = useMemo(() => Date.now(), []);

  useEffect(() => {
    setPattern(buildPatternRound(config.options));
    setFeedback(null);
  }, [round, config.options]);

  const choose = (symbol: string) => {
    if (feedback || symbol !== pattern.target) return;
    setFeedback('correct');
    setTimeout(() => {
      if (round + 1 >= config.rounds) {
        onComplete({
          gameType: 'pattern_match',
          score: config.rounds,
          reward,
          durationSec: Math.round((Date.now() - started) / 1000),
        });
      } else {
        setRound((r) => r + 1);
      }
    }, 500);
  };

  return (
    <View className="items-center py-2">
      <Text className="text-[13px] font-semibold uppercase tracking-wider text-revive-primary dark:text-revive-primary-dark">
        Round {round + 1} of {config.rounds}
      </Text>
      <Text className="mt-2 text-center text-base text-revive-muted dark:text-revive-muted-dark">
        Find the matching symbol
      </Text>

      <View className="mt-8 h-24 w-24 items-center justify-center rounded-3xl bg-revive-mist dark:bg-revive-mist-dark">
        <Text className="text-5xl">{pattern.target}</Text>
      </View>

      <Animated.View
        key={round}
        entering={FadeInDown.duration(300)}
        className="mt-10 flex-row flex-wrap justify-center gap-3">
        {pattern.options.map((symbol, i) => (
          <Pressable
            key={`${symbol}-${i}`}
            accessibilityRole="button"
            disabled={feedback !== null}
            onPress={() => choose(symbol)}
            className={`h-16 w-16 items-center justify-center rounded-2xl border active:scale-95 ${
              feedback === 'correct' && symbol === pattern.target
                ? 'border-revive-primary bg-revive-secondary/30 dark:border-revive-primary-dark dark:bg-revive-primary-dark/20'
                : 'border-revive-mist bg-revive-card dark:border-revive-mist-dark dark:bg-revive-card-dark'
            }`}>
            <Text className="text-3xl">{symbol}</Text>
          </Pressable>
        ))}
      </Animated.View>
    </View>
  );
}
