import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import {
  buildNumberSequence,
  Difficulty,
  GameResult,
  numberRecallLengths,
} from '@/services/gameEngine';

type NumberRecallGameProps = {
  reward: number;
  difficulty: Difficulty;
  onComplete: (result: GameResult) => void;
};

type Phase = 'showing' | 'recall' | 'wrong';

/** Number Recall — focus training. Remember a growing digit sequence. */
export default function NumberRecallGame({ reward, difficulty, onComplete }: NumberRecallGameProps) {
  const roundLengths = useMemo(() => numberRecallLengths(difficulty), [difficulty]);
  const [round, setRound] = useState(0);
  const [sequence, setSequence] = useState<number[]>(() => buildNumberSequence(roundLengths[0]));
  const [phase, setPhase] = useState<Phase>('showing');
  const [input, setInput] = useState<number[]>([]);
  const started = useMemo(() => Date.now(), []);

  useEffect(() => {
    setPhase('showing');
    setInput([]);
    const showMs = 900 + sequence.length * 650;
    const timer = setTimeout(() => setPhase('recall'), showMs);
    return () => clearTimeout(timer);
  }, [sequence]);

  const tap = (digit: number) => {
    if (phase !== 'recall') return;
    const next = [...input, digit];
    const position = next.length - 1;

    if (sequence[position] !== digit) {
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
          gameType: 'number_recall',
          score: roundLengths.length,
          reward,
          durationSec: Math.round((Date.now() - started) / 1000),
        });
      } else {
        const nextRound = round + 1;
        setRound(nextRound);
        setSequence(buildNumberSequence(roundLengths[nextRound]));
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
          ? 'Memorize the numbers…'
          : phase === 'wrong'
            ? 'Not quite — one more try'
            : 'Enter the sequence'}
      </Text>

      {phase === 'showing' ? (
        <Animated.View
          key={`show-${round}`}
          entering={FadeIn.duration(300)}
          className="mt-8 flex-row flex-wrap justify-center gap-3">
          {sequence.map((n, index) => (
            <View
              key={index}
              className="h-14 w-14 items-center justify-center rounded-2xl bg-revive-mist dark:bg-revive-mist-dark">
              <Text className="text-2xl font-bold text-revive-ink dark:text-revive-ink-dark">{n}</Text>
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

          <View className="mt-9 flex-row flex-wrap justify-center gap-2.5">
            {Array.from({ length: 10 }, (_, digit) => digit).map((digit) => (
              <Pressable
                key={digit}
                accessibilityRole="button"
                disabled={phase !== 'recall'}
                onPress={() => tap(digit)}
                className={`h-14 w-14 items-center justify-center rounded-2xl active:scale-95 ${
                  phase === 'wrong'
                    ? 'bg-revive-storm-chip dark:bg-revive-storm-chip-dark'
                    : 'bg-revive-card dark:bg-revive-card-dark'
                } border border-revive-mist dark:border-revive-mist-dark`}>
                <Text className="text-xl font-bold text-revive-ink dark:text-revive-ink-dark">{digit}</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}
    </View>
  );
}
