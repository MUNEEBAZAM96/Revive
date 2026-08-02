import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import {
  buildColorSequence,
  colorFocusLengths,
  Difficulty,
  FOCUS_COLORS,
  GameResult,
} from '@/services/gameEngine';

type ColorFocusGameProps = {
  reward: number;
  difficulty: Difficulty;
  onComplete: (result: GameResult) => void;
};

type Phase = 'showing' | 'recall' | 'wrong';

/** Color Focus — a Simon-style calm color sequence, repeat it back. */
export default function ColorFocusGame({ reward, difficulty, onComplete }: ColorFocusGameProps) {
  const roundLengths = useMemo(() => colorFocusLengths(difficulty), [difficulty]);
  const [round, setRound] = useState(0);
  const [sequence, setSequence] = useState<string[]>(() => buildColorSequence(roundLengths[0]));
  const [phase, setPhase] = useState<Phase>('showing');
  const [input, setInput] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const started = useMemo(() => Date.now(), []);

  useEffect(() => {
    setPhase('showing');
    setInput([]);
    let cancelled = false;
    let i = 0;
    const showNext = () => {
      if (cancelled || i >= sequence.length) {
        if (!cancelled) setPhase('recall');
        return;
      }
      setActiveId(sequence[i]);
      setTimeout(() => {
        if (cancelled) return;
        setActiveId(null);
        i += 1;
        setTimeout(showNext, 250);
      }, 500);
    };
    const startTimer = setTimeout(showNext, 500);
    return () => {
      cancelled = true;
      clearTimeout(startTimer);
    };
  }, [sequence]);

  const tap = (id: string) => {
    if (phase !== 'recall') return;
    const next = [...input, id];
    const position = next.length - 1;

    if (sequence[position] !== id) {
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
          gameType: 'color_focus',
          score: roundLengths.length,
          reward,
          durationSec: Math.round((Date.now() - started) / 1000),
        });
      } else {
        const nextRound = round + 1;
        setRound(nextRound);
        setSequence(buildColorSequence(roundLengths[nextRound]));
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
          ? 'Watch the colors…'
          : phase === 'wrong'
            ? 'Not quite — let’s try again'
            : 'Repeat the sequence'}
      </Text>

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

      <View className="mt-9 flex-row flex-wrap justify-center gap-4">
        {FOCUS_COLORS.map((color) => (
          <Pressable
            key={color.id}
            accessibilityRole="button"
            disabled={phase !== 'recall'}
            onPress={() => tap(color.id)}
            className="h-20 w-20 items-center justify-center rounded-3xl active:scale-95"
            style={{
              backgroundColor: color.hex,
              opacity: activeId === color.id ? 1 : activeId ? 0.4 : 1,
              transform: [{ scale: activeId === color.id ? 1.1 : 1 }],
            }}
          />
        ))}
      </View>
    </View>
  );
}
