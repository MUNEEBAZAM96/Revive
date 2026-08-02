import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import {
  buildSequence,
  Difficulty,
  GameResult,
  GARDEN_ITEMS,
  memoryGardenRounds,
} from '@/services/gameEngine';

type MemoryGardenGameProps = {
  reward: number;
  difficulty: Difficulty;
  onComplete: (result: GameResult) => void;
};

type Phase = 'showing' | 'recall' | 'wrong';

/**
 * Memory Garden — attention training. A short sequence of garden items appears,
 * then hides; the user repeats the order from memory. Rounds grow with
 * difficulty so it trains, never punishes.
 */
export default function MemoryGardenGame({ reward, difficulty, onComplete }: MemoryGardenGameProps) {
  const roundLengths = useMemo(() => memoryGardenRounds(difficulty), [difficulty]);
  const [round, setRound] = useState(0);
  const [sequence, setSequence] = useState<string[]>(() => buildSequence(roundLengths[0]));
  const [phase, setPhase] = useState<Phase>('showing');
  const [input, setInput] = useState<string[]>([]);
  const started = useMemo(() => Date.now(), []);

  useEffect(() => {
    setPhase('showing');
    setInput([]);
    const showMs = 900 + sequence.length * 700;
    const timer = setTimeout(() => setPhase('recall'), showMs);
    return () => clearTimeout(timer);
  }, [sequence]);

  const tap = (item: string) => {
    if (phase !== 'recall') return;
    const next = [...input, item];
    const position = next.length - 1;

    if (sequence[position] !== item) {
      setPhase('wrong');
      setTimeout(() => {
        setInput([]);
        setPhase('showing');
      }, 900);
      return;
    }

    setInput(next);

    if (next.length === sequence.length) {
      if (round + 1 >= roundLengths.length) {
        onComplete({
          gameType: 'memory_garden',
          score: roundLengths.length,
          reward,
          durationSec: Math.round((Date.now() - started) / 1000),
        });
      } else {
        const nextRound = round + 1;
        setRound(nextRound);
        setSequence(buildSequence(roundLengths[nextRound]));
      }
    }
  };

  return (
    <View className="items-center py-2">
      <Text className="text-[13px] font-semibold uppercase tracking-wider text-revive-primary dark:text-revive-primary-dark">
        Round {round + 1} of {roundLengths.length}
      </Text>
      <Text className="mt-2 text-center text-base text-revive-muted dark:text-revive-muted-dark">
        {phase === 'showing'
          ? 'Watch closely…'
          : phase === 'wrong'
            ? 'Not quite — let’s try again'
            : 'Now repeat the order'}
      </Text>

      {phase === 'showing' ? (
        <Animated.View
          key={`show-${round}`}
          entering={FadeIn.duration(300)}
          className="mt-8 flex-row flex-wrap justify-center gap-3">
          {sequence.map((item, index) => (
            <View
              key={index}
              className="h-14 w-14 items-center justify-center rounded-2xl bg-revive-mist dark:bg-revive-mist-dark">
              <Text className="text-3xl">{item}</Text>
            </View>
          ))}
        </Animated.View>
      ) : (
        <>
          <View className="mt-8 flex-row flex-wrap justify-center gap-2">
            {sequence.map((_, index) => (
              <View
                key={index}
                className={`h-3 w-3 rounded-full ${
                  index < input.length
                    ? 'bg-revive-primary dark:bg-revive-primary-dark'
                    : 'bg-revive-mist dark:bg-revive-mist-dark'
                }`}
              />
            ))}
          </View>

          <View className="mt-9 flex-row flex-wrap justify-center gap-3">
            {GARDEN_ITEMS.map((item) => (
              <Pressable
                key={item}
                accessibilityRole="button"
                disabled={phase !== 'recall'}
                onPress={() => tap(item)}
                className={`h-16 w-16 items-center justify-center rounded-2xl active:scale-95 ${
                  phase === 'wrong'
                    ? 'bg-revive-storm-chip dark:bg-revive-storm-chip-dark'
                    : 'bg-revive-card dark:bg-revive-card-dark'
                } border border-revive-mist dark:border-revive-mist-dark`}>
                <Text className="text-3xl">{item}</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}
    </View>
  );
}
