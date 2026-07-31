import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import AnimatedProgress from './AnimatedProgress';
import { gardenSummary, nextMilestoneFor, stageFor } from './gardenData';
import { cardShadow } from './theme';

type RecoveryGardenCardProps = {
  delay?: number;
};

/**
 * Growth instead of streaks: storms pause the garden, they never shrink it,
 * and every past journey stays planted in the forest. No failure states.
 */
export default function RecoveryGardenCard({ delay = 0 }: RecoveryGardenCardProps) {
  const router = useRouter();
  const { growthDays, checkedInToday, pastJourneys } = gardenSummary;
  const stage = stageFor(growthDays);
  const next = nextMilestoneFor(growthDays);
  const float = useSharedValue(0);

  useEffect(() => {
    float.value = withRepeat(
      withSequence(
        withTiming(-7, { duration: 2600, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 2600, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
    );
  }, [float]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: float.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(550)} style={cardShadow}>
      <View className="rounded-[28px] bg-revive-card p-6 dark:bg-revive-card-dark">
        <Text className="text-xl font-semibold text-revive-ink dark:text-revive-ink-dark">
          Your Recovery Garden
        </Text>

        <View className="mt-4 items-center">
          <View className="h-32 w-32 items-center justify-center rounded-full bg-revive-mist dark:bg-revive-mist-dark">
            <Animated.View style={floatStyle}>
              <Text className="text-6xl">{stage.emoji}</Text>
            </Animated.View>
          </View>
          <Text className="mt-4 text-sm text-revive-muted dark:text-revive-muted-dark">
            Growing for
          </Text>
          <Text className="mt-1 text-4xl font-extrabold text-revive-primary dark:text-revive-primary-dark">
            {growthDays} Days
          </Text>
          <Text className="mt-3 text-center text-sm text-revive-muted dark:text-revive-muted-dark">
            Every healthy choice helps you grow.
          </Text>
        </View>

        {next && (
          <View className="mt-6">
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-[13px] font-medium text-revive-muted dark:text-revive-muted-dark">
                Next: {next.label} {next.emoji}
              </Text>
              <Text className="text-[13px] font-medium text-revive-muted dark:text-revive-muted-dark">
                {next.days} days
              </Text>
            </View>
            <AnimatedProgress progress={growthDays / next.days} delay={delay + 500} />
          </View>
        )}

        {/* The forest: every journey stays planted, sized by how far it grew. */}
        <View className="mt-6 rounded-2xl bg-revive-mist p-4 dark:bg-revive-mist-dark">
          <Text className="text-xs font-semibold uppercase tracking-wider text-revive-muted dark:text-revive-muted-dark">
            Your forest
          </Text>
          <View className="mt-2 flex-row items-end gap-5">
            {pastJourneys.map((journey, index) => (
              <View key={index} className="items-center">
                <Text className="text-2xl">{stageFor(journey.growthDays).emoji}</Text>
                <Text className="mt-0.5 text-[11px] text-revive-muted dark:text-revive-muted-dark">
                  {journey.growthDays} days
                </Text>
              </View>
            ))}
            <View className="items-center">
              <Text className="text-3xl">{stage.emoji}</Text>
              <Text className="mt-0.5 text-[11px] font-semibold text-revive-primary dark:text-revive-primary-dark">
                growing now
              </Text>
            </View>
          </View>
        </View>

        {/* Gentle nudge — invitation, never guilt. Only when today is unwatered. */}
        {!checkedInToday && (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/(modals)/daily-check-in')}
            className="mt-4 flex-row items-center rounded-2xl border-2 border-dashed border-revive-secondary/70 px-4 py-3 active:opacity-85 dark:border-revive-primary-dark/40">
            <Text className="text-lg">💧</Text>
            <Text className="ml-2.5 flex-1 text-sm text-revive-ink dark:text-revive-ink-dark">
              Your tree is waiting for <Text className="font-semibold">water</Text>
            </Text>
            <Text className="text-sm font-bold text-revive-primary dark:text-revive-primary-dark">
              Check in →
            </Text>
          </Pressable>
        )}

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/(modals)/journey-calendar')}
          className="mt-4 flex-row items-center justify-center rounded-2xl bg-revive-mist py-3 active:opacity-85 dark:bg-revive-mist-dark">
          <Text className="text-[15px] font-semibold text-revive-primary dark:text-revive-primary-dark">
            View your journey  📅
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}
