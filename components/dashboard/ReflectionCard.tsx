import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { cardShadow } from './theme';

type ReflectionCardProps = {
  prompt?: string;
  onWrite?: () => void;
  delay?: number;
};

const DEFAULT_PROMPT = 'What is one thing you handled well today?';

export default function ReflectionCard({
  prompt = DEFAULT_PROMPT,
  onWrite,
  delay = 0,
}: ReflectionCardProps) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(550)} style={cardShadow}>
      <View className="rounded-[28px] bg-revive-card p-6 dark:bg-revive-card-dark">
        <View className="flex-row items-center justify-between">
          <Text className="text-xl font-semibold text-revive-ink dark:text-revive-ink-dark">
            Today&apos;s Reflection
          </Text>
          <Text className="text-2xl">✍️</Text>
        </View>

        <Text className="mt-3 text-base leading-6 text-revive-ink dark:text-revive-ink-dark">
          {prompt}
        </Text>
        <Text className="mt-2 text-[13px] italic text-revive-muted dark:text-revive-muted-dark">
          Small choices create a stronger future.
        </Text>

        <Pressable
          accessibilityRole="button"
          onPress={onWrite}
          className="mt-5 items-center rounded-2xl bg-revive-mist py-3.5 active:opacity-85 dark:bg-revive-mist-dark">
          <Text className="text-base font-semibold text-revive-primary dark:text-revive-primary-dark">
            Write Reflection
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}
