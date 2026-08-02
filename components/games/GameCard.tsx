import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import type { Difficulty } from '@/services/gameEngine';
import type { MindChallenge } from '@/services/dailyChallengeService';

type GameCardProps = {
  challenge: MindChallenge;
  completed: boolean;
  difficulty: Difficulty;
  onPress: () => void;
  delay?: number;
};

const DIFFICULTY_STYLE: Record<Difficulty, { label: string; bg: string; text: string }> = {
  easy: {
    label: 'Easy',
    bg: 'bg-revive-secondary/30 dark:bg-revive-primary-dark/20',
    text: 'text-revive-primary dark:text-revive-primary-dark',
  },
  medium: {
    label: 'Medium',
    bg: 'bg-[#F4D98C33]',
    text: 'text-[#8A6A1F] dark:text-[#F4D98C]',
  },
  hard: {
    label: 'Hard',
    bg: 'bg-[#F2617D1A]',
    text: 'text-[#D1567B]',
  },
};

/** One playlist entry — icon, title, difficulty, duration, reward, Play button. */
export default function GameCard({ challenge, completed, difficulty, onPress, delay = 0 }: GameCardProps) {
  const diff = DIFFICULTY_STYLE[difficulty];

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(450)}>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        className="mb-3 flex-row items-center rounded-3xl bg-revive-card p-4 active:scale-[0.98] dark:bg-revive-card-dark"
        style={{ boxShadow: '0px 4px 12px rgba(26, 58, 44, 0.06)' }}>
        <View className="h-14 w-14 items-center justify-center rounded-2xl bg-revive-mist dark:bg-revive-mist-dark">
          <Text className="text-3xl">{challenge.emoji}</Text>
        </View>

        <View className="ml-3.5 flex-1">
          <Text className="text-base font-semibold text-revive-ink dark:text-revive-ink-dark">
            {challenge.title}
          </Text>
          <View className="mt-1.5 flex-row items-center gap-1.5">
            <View className={`rounded-full px-2 py-0.5 ${diff.bg}`}>
              <Text className={`text-[11px] font-semibold ${diff.text}`}>{diff.label}</Text>
            </View>
            <Text className="text-[12px] text-revive-muted dark:text-revive-muted-dark">
              {challenge.durationLabel}
            </Text>
          </View>
        </View>

        <View className="items-end">
          <Text className="mb-1.5 text-[12px] font-bold text-revive-primary dark:text-revive-primary-dark">
            +{challenge.reward} 🌿
          </Text>
          {completed ? (
            <View className="h-9 w-9 items-center justify-center rounded-full bg-revive-primary dark:bg-revive-primary-dark">
              <Text className="text-base font-bold text-white">✓</Text>
            </View>
          ) : (
            <View className="h-9 w-9 items-center justify-center rounded-full bg-revive-primary dark:bg-revive-primary-dark">
              <Text className="text-sm text-white">▶</Text>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}
