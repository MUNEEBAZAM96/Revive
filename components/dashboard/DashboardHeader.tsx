import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { cosmeticById } from '@/services/cosmeticsService';
import { titleForLevel } from '@/services/growthLevels';
import { useGrowthStore } from '@/stores/growthStore';

type DashboardHeaderProps = {
  name: string | null;
  delay?: number;
};

function greetingForNow(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Keep going';
  return 'Reflect on today';
}

/**
 * The premium header: profile (with equipped frame) + level identity on the
 * left, Revive Score + Diamonds on the right. This — plus the daily playlist,
 * missions, and reward strip — is the entire Dashboard; no extra cards.
 */
export default function DashboardHeader({ name, delay = 0 }: DashboardHeaderProps) {
  const router = useRouter();
  const level = useGrowthStore((s) => s.level);
  const reviveScore = useGrowthStore((s) => s.reviveScore);
  const diamonds = useGrowthStore((s) => s.diamonds);
  const equippedFrame = useGrowthStore((s) => s.equippedCosmetics.profile_frame);

  const title = titleForLevel(level);
  const greeting = greetingForNow();
  const firstName = name?.trim() ? ` ${name.trim().split(' ')[0]}` : '';
  const frameColor = cosmeticById(equippedFrame)?.frameColor ?? 'transparent';

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(550)}>
      <View className="flex-row items-center justify-between">
        <View className="flex-1 flex-row items-center pr-3">
          <View
            className="h-14 w-14 items-center justify-center rounded-full bg-revive-mist dark:bg-revive-mist-dark"
            style={{ borderWidth: frameColor === 'transparent' ? 0 : 3, borderColor: frameColor }}
            accessibilityLabel="Your profile">
            <Text className="text-2xl">🌱</Text>
          </View>
          <View className="ml-3 flex-1">
            <Text
              className="text-lg font-bold text-revive-ink dark:text-revive-ink-dark"
              numberOfLines={1}>
              {greeting}
              {firstName} 🌿
            </Text>
            <Text className="mt-0.5 text-[13px] font-medium text-revive-muted dark:text-revive-muted-dark">
              Level {level} · {title.label}
            </Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open Rewards Shop"
          onPress={() => router.push('/(modals)/rewards-shop')}
          className="items-end active:opacity-75">
          <View className="flex-row items-center">
            <Text className="text-lg">🌿</Text>
            <Text className="ml-1 text-xl font-extrabold text-revive-primary dark:text-revive-primary-dark">
              {reviveScore.toLocaleString()}
            </Text>
          </View>
          <View className="mt-0.5 flex-row items-center">
            <Text className="text-sm">💎</Text>
            <Text className="ml-1 text-sm font-bold text-revive-ink dark:text-revive-ink-dark">
              {diamonds.toLocaleString()}
            </Text>
          </View>
        </Pressable>
      </View>
    </Animated.View>
  );
}
