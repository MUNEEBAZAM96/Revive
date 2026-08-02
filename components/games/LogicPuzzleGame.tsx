import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import {
  buildLogicPuzzle,
  Difficulty,
  GameResult,
  LogicPuzzleRound,
  logicPuzzleRounds,
} from '@/services/gameEngine';

type LogicPuzzleGameProps = {
  reward: number;
  difficulty: Difficulty;
  onComplete: (result: GameResult) => void;
};

/** Logic Puzzle — focus training. A small "what comes next" number sequence. */
export default function LogicPuzzleGame({ reward, difficulty, onComplete }: LogicPuzzleGameProps) {
  const totalRounds = useMemo(() => logicPuzzleRounds(difficulty), [difficulty]);
  const [round, setRound] = useState(0);
  const [puzzle, setPuzzle] = useState<LogicPuzzleRound>(() => buildLogicPuzzle(difficulty));
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const started = useMemo(() => Date.now(), []);

  useEffect(() => {
    setPuzzle(buildLogicPuzzle(difficulty));
    setFeedback(null);
  }, [round, difficulty]);

  const choose = (value: number) => {
    if (feedback) return;
    if (value !== puzzle.answer) {
      setFeedback('wrong');
      setTimeout(() => setFeedback(null), 500);
      return;
    }
    setFeedback('correct');
    setTimeout(() => {
      if (round + 1 >= totalRounds) {
        onComplete({
          gameType: 'logic_puzzle',
          score: totalRounds,
          reward,
          durationSec: Math.round((Date.now() - started) / 1000),
        });
      } else {
        setRound((r) => r + 1);
      }
    }, 600);
  };

  return (
    <View className="items-center py-2">
      <Text className="text-[13px] font-semibold uppercase tracking-wider text-revive-primary dark:text-revive-primary-dark">
        Puzzle {round + 1} of {totalRounds}
      </Text>
      <Text className="mt-2 text-center text-base text-revive-muted dark:text-revive-muted-dark">
        What comes next?
      </Text>

      <Animated.View
        key={round}
        entering={FadeInDown.duration(300)}
        className="mt-8 flex-row items-center gap-2">
        {puzzle.sequence.map((n, i) => (
          <View
            key={i}
            className="h-14 w-14 items-center justify-center rounded-2xl bg-revive-mist dark:bg-revive-mist-dark">
            <Text className="text-xl font-bold text-revive-ink dark:text-revive-ink-dark">{n}</Text>
          </View>
        ))}
        <View className="h-14 w-14 items-center justify-center rounded-2xl border-2 border-dashed border-revive-primary/50 dark:border-revive-primary-dark/50">
          <Text className="text-xl font-bold text-revive-primary dark:text-revive-primary-dark">
            {feedback === 'correct' ? puzzle.answer : '?'}
          </Text>
        </View>
      </Animated.View>

      {feedback === 'correct' && (
        <Animated.Text
          entering={FadeIn.duration(250)}
          className="mt-5 text-base font-semibold text-revive-primary dark:text-revive-primary-dark">
          Nice thinking 🌿
        </Animated.Text>
      )}

      <View className="mt-9 flex-row flex-wrap justify-center gap-3">
        {puzzle.choices.map((choice) => (
          <Pressable
            key={choice}
            accessibilityRole="button"
            disabled={feedback !== null}
            onPress={() => choose(choice)}
            className={`h-14 w-16 items-center justify-center rounded-2xl active:scale-95 ${
              feedback === 'wrong'
                ? 'bg-revive-storm-chip dark:bg-revive-storm-chip-dark'
                : 'bg-revive-card dark:bg-revive-card-dark'
            } border border-revive-mist dark:border-revive-mist-dark`}>
            <Text className="text-lg font-bold text-revive-ink dark:text-revive-ink-dark">{choice}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
