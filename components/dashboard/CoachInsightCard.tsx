import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { cardShadow } from './theme';

type CoachInsightCardProps = {
  insight?: string;
  onTalk?: () => void;
  delay?: number;
};

const DEFAULT_INSIGHT =
  'I noticed evenings are usually your difficult time.\n\nWould you like to prepare a plan for tonight?';

/** A warm note from the coach — a companion, never an "AI assistant". */
export default function CoachInsightCard({
  insight = DEFAULT_INSIGHT,
  onTalk,
  delay = 0,
}: CoachInsightCardProps) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(550)} style={cardShadow}>
      <View className="rounded-[28px] bg-revive-card p-6 dark:bg-revive-card-dark">
        <View className="flex-row items-center">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-revive-mist dark:bg-revive-mist-dark">
            <Text className="text-lg">🌿</Text>
          </View>
          <View className="ml-3">
            <Text className="text-xl font-semibold text-revive-ink dark:text-revive-ink-dark">
              Your Coach
            </Text>
            <Text className="text-[13px] text-revive-muted dark:text-revive-muted-dark">
              Your Recovery Companion
            </Text>
          </View>
        </View>

        <View className="mt-4 rounded-3xl rounded-tl-md bg-revive-mist p-4 dark:bg-revive-mist-dark">
          <Text className="text-base leading-6 text-revive-ink dark:text-revive-ink-dark">
            {insight}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={onTalk}
          className="mt-5 items-center rounded-2xl border border-revive-secondary/60 bg-revive-bg py-3.5 active:opacity-85 dark:border-revive-primary-dark/40 dark:bg-revive-bg-dark">
          <Text className="text-base font-semibold text-revive-primary dark:text-revive-primary-dark">
            Talk to Coach
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}
