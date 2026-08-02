import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import {
  buildWordPuzzle,
  Difficulty,
  GameResult,
  pickWords,
  wordBuilderRounds,
  WordPuzzle,
} from '@/services/gameEngine';

type WordBuilderGameProps = {
  reward: number;
  difficulty: Difficulty;
  onComplete: (result: GameResult) => void;
};

/**
 * Word Builder — build positive identity. The user completes words that
 * describe who they're becoming (CONFIDENCE, DISCIPLINE, PATIENCE…), one
 * missing letter at a time.
 */
export default function WordBuilderGame({ reward, difficulty, onComplete }: WordBuilderGameProps) {
  const totalRounds = useMemo(() => wordBuilderRounds(difficulty), [difficulty]);
  const words = useMemo(() => pickWords(totalRounds), [totalRounds]);
  const [round, setRound] = useState(0);
  const [puzzle, setPuzzle] = useState<WordPuzzle>(() => buildWordPuzzle(words[0]));
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const started = useMemo(() => Date.now(), []);

  useEffect(() => {
    setPuzzle(buildWordPuzzle(words[round]));
    setFeedback(null);
  }, [round, words]);

  const choose = (letter: string) => {
    if (feedback) return;
    const correct = puzzle.word[puzzle.missingIndex];
    if (letter !== correct) {
      setFeedback('wrong');
      setTimeout(() => setFeedback(null), 500);
      return;
    }
    setFeedback('correct');
    setTimeout(() => {
      if (round + 1 >= totalRounds) {
        onComplete({
          gameType: 'word_builder',
          score: totalRounds,
          reward,
          durationSec: Math.round((Date.now() - started) / 1000),
        });
      } else {
        setRound((r) => r + 1);
      }
    }, 700);
  };

  const letters = puzzle.word.split('').map((letter, index) =>
    index === puzzle.missingIndex ? null : letter,
  );

  return (
    <View className="items-center py-2">
      <Text className="text-[13px] font-semibold uppercase tracking-wider text-revive-primary dark:text-revive-primary-dark">
        Word {round + 1} of {totalRounds}
      </Text>
      <Text className="mt-2 text-center text-base text-revive-muted dark:text-revive-muted-dark">
        Choose the missing letter
      </Text>

      <Animated.View
        key={puzzle.word + round}
        entering={FadeInDown.duration(350)}
        className="mt-8 flex-row flex-wrap justify-center gap-2">
        {letters.map((letter, index) => (
          <View
            key={index}
            className={`h-12 w-9 items-center justify-center rounded-xl border-2 ${
              letter === null
                ? feedback === 'correct'
                  ? 'border-revive-primary bg-revive-secondary/30 dark:border-revive-primary-dark dark:bg-revive-primary-dark/20'
                  : 'border-dashed border-revive-primary/50 dark:border-revive-primary-dark/50'
                : 'border-revive-mist bg-revive-mist dark:border-revive-mist-dark dark:bg-revive-mist-dark'
            }`}>
            <Text className="text-lg font-extrabold text-revive-ink dark:text-revive-ink-dark">
              {letter === null ? (feedback === 'correct' ? puzzle.word[puzzle.missingIndex] : '') : letter}
            </Text>
          </View>
        ))}
      </Animated.View>

      {feedback === 'correct' && (
        <Animated.Text
          entering={FadeIn.duration(250)}
          className="mt-5 text-base font-semibold text-revive-primary dark:text-revive-primary-dark">
          {puzzle.word.charAt(0) + puzzle.word.slice(1).toLowerCase()} unlocked 🌿
        </Animated.Text>
      )}

      <View className="mt-9 flex-row flex-wrap justify-center gap-3">
        {puzzle.choices.map((letter) => (
          <Pressable
            key={letter}
            accessibilityRole="button"
            disabled={feedback !== null}
            onPress={() => choose(letter)}
            className={`h-14 w-14 items-center justify-center rounded-2xl active:scale-95 ${
              feedback === 'wrong'
                ? 'bg-revive-storm-chip dark:bg-revive-storm-chip-dark'
                : 'bg-revive-card dark:bg-revive-card-dark'
            } border border-revive-mist dark:border-revive-mist-dark`}>
            <Text className="text-xl font-bold text-revive-ink dark:text-revive-ink-dark">
              {letter}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
