import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useReviveColors } from './theme';

type DashboardHeaderProps = {
  daysGrowing: number;
  delay?: number;
};

function greetingForNow(): { title: string; emoji: string } {
  const hour = new Date().getHours();
  if (hour < 12) return { title: 'Good Morning', emoji: '👋' };
  if (hour < 18) return { title: 'Keep going', emoji: '🌤️' };
  return { title: 'Reflect on your day', emoji: '🌙' };
}

export default function DashboardHeader({ daysGrowing, delay = 0 }: DashboardHeaderProps) {
  const router = useRouter();
  const colors = useReviveColors();
  const greeting = greetingForNow();

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(550)}>
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-4">
          <Text className="text-[32px] font-bold leading-tight text-revive-ink dark:text-revive-ink-dark">
            {greeting.title} {greeting.emoji}
          </Text>
          <Text className="mt-2 text-base text-revive-muted dark:text-revive-muted-dark">
            Welcome back.
          </Text>
          <Text className="mt-1 text-base font-medium text-revive-primary dark:text-revive-primary-dark">
            Day {daysGrowing} of rebuilding yourself.
          </Text>
        </View>

        <View className="flex-row gap-2.5">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View your journey calendar"
            onPress={() => router.push('/(modals)/journey-calendar')}
            className="h-12 w-12 items-center justify-center rounded-full bg-revive-mist active:opacity-80 dark:bg-revive-mist-dark">
            <FontAwesome name="calendar" size={18} color={colors.primary} />
          </Pressable>
          <View
            className="h-12 w-12 items-center justify-center rounded-full bg-revive-mist dark:bg-revive-mist-dark"
            accessibilityLabel="Your private profile">
            <Text className="text-xl">🌱</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}
