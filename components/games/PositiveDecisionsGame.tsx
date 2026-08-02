import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import {
  decisionRounds,
  DecisionScenario,
  Difficulty,
  GameResult,
  pickScenarios,
} from '@/services/gameEngine';

type PositiveDecisionsGameProps = {
  reward: number;
  difficulty: Difficulty;
  onComplete: (result: GameResult) => void;
};

/**
 * Positive Decisions — decision-making training. Short recovery scenarios,
 * choose the healthiest path. Every choice gets affirming feedback — this is
 * practice, not a test with a wrong-answer penalty.
 */
export default function PositiveDecisionsGame({ reward, difficulty, onComplete }: PositiveDecisionsGameProps) {
  const totalRounds = useMemo(() => decisionRounds(difficulty), [difficulty]);
  const scenarios = useMemo(() => pickScenarios(totalRounds), [totalRounds]);
  const [round, setRound] = useState(0);
  const [healthyChoices, setHealthyChoices] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const started = useMemo(() => Date.now(), []);

  const scenario: DecisionScenario = scenarios[round];

  const choose = (isHealthy: boolean, text: string) => {
    if (feedback) return;
    setFeedback(text);
    const nextHealthy = healthyChoices + (isHealthy ? 1 : 0);
    setHealthyChoices(nextHealthy);
    setTimeout(() => {
      if (round + 1 >= totalRounds) {
        onComplete({
          gameType: 'positive_decisions',
          score: nextHealthy,
          reward,
          durationSec: Math.round((Date.now() - started) / 1000),
        });
      } else {
        setRound((r) => r + 1);
        setFeedback(null);
      }
    }, 1400);
  };

  return (
    <View className="items-center py-2">
      <Text className="text-[13px] font-semibold uppercase tracking-wider text-revive-primary dark:text-revive-primary-dark">
        Scenario {round + 1} of {totalRounds}
      </Text>

      <Animated.View
        key={scenario.id}
        entering={FadeInDown.duration(350)}
        className="mt-5 w-full rounded-3xl bg-revive-mist p-5 dark:bg-revive-mist-dark">
        <Text className="text-center text-base leading-6 text-revive-ink dark:text-revive-ink-dark">
          {scenario.prompt}
        </Text>
      </Animated.View>

      <View className="mt-6 w-full">
        {scenario.options.map((option) => (
          <Pressable
            key={option.label}
            accessibilityRole="button"
            disabled={feedback !== null}
            onPress={() => choose(option.isHealthy, option.feedback)}
            className="mb-3 rounded-2xl border border-revive-mist bg-revive-card px-4 py-3.5 active:scale-[0.98] dark:border-revive-mist-dark dark:bg-revive-card-dark">
            <Text className="text-base font-medium text-revive-ink dark:text-revive-ink-dark">
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {feedback && (
        <Animated.Text
          entering={FadeIn.duration(250)}
          className="mt-2 text-center text-[13px] italic text-revive-primary dark:text-revive-primary-dark">
          {feedback}
        </Animated.Text>
      )}
    </View>
  );
}
