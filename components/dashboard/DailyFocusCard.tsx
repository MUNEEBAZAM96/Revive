import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { cardShadow } from './theme';

type DailyFocusCardProps = {
  focus: string;
  durationLabel?: string;
  onStart?: () => void;
  delay?: number;
};

/**
 * "Today's Journey" — the hero card. Content is data-driven so the daily
 * session can rotate (Understanding Your Triggers, Managing Strong Urges…).
 */
export default function DailyFocusCard({
  focus,
  durationLabel = '5 minute exercise',
  onStart,
  delay = 0,
}: DailyFocusCardProps) {
  const isDark = useColorScheme() === 'dark';

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(550)} style={cardShadow}>
      <LinearGradient
        colors={isDark ? ['#1E3328', '#18221D'] : ['#DFF0E5', '#F4FBF6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 28 }}>
        <View className="p-6">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-semibold uppercase tracking-wider text-revive-primary dark:text-revive-primary-dark">
              Today&apos;s Journey
            </Text>
            <Text className="text-2xl">🧭</Text>
          </View>

          <Text className="mt-5 text-sm text-revive-muted dark:text-revive-muted-dark">
            Today&apos;s Focus
          </Text>
          <Text className="mt-1 text-xl font-semibold text-revive-ink dark:text-revive-ink-dark">
            {focus}
          </Text>
          <Text className="mt-1 text-sm text-revive-muted dark:text-revive-muted-dark">
            {durationLabel}
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={onStart}
            className="mt-6 items-center rounded-2xl bg-revive-primary py-3.5 active:opacity-85 dark:bg-revive-primary-dark">
            <Text className="text-base font-semibold text-white dark:text-revive-bg-dark">
              Start Session
            </Text>
          </Pressable>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}
