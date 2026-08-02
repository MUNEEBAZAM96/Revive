import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { todayKey } from '@/services/growthService';
import { useGrowthStore } from '@/stores/growthStore';

type DailyRewardStripProps = {
  delay?: number;
};

/** A compact once-a-day streak bonus — "Day 4 streak — claim +14 🌿". */
export default function DailyRewardStrip({ delay = 0 }: DailyRewardStripProps) {
  const currentStreak = useGrowthStore((s) => s.currentStreak);
  const lastRewardClaimDate = useGrowthStore((s) => s.lastRewardClaimDate);
  const claimDailyReward = useGrowthStore((s) => s.claimDailyReward);

  const claimed = lastRewardClaimDate === todayKey();
  const streakDisplay = Math.max(currentStreak, 1);
  const reward = 10 + Math.min(currentStreak, 10);

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(450)}>
      <View className="flex-row items-center justify-between rounded-2xl bg-revive-mist px-4 py-3.5 dark:bg-revive-mist-dark">
        <View className="flex-row items-center">
          <Text className="text-xl">🔥</Text>
          <Text className="ml-2 text-[14px] font-semibold text-revive-ink dark:text-revive-ink-dark">
            Day {streakDisplay} streak
          </Text>
        </View>

        {claimed ? (
          <View className="rounded-full bg-revive-secondary/30 px-3.5 py-2 dark:bg-revive-primary-dark/20">
            <Text className="text-[13px] font-semibold text-revive-primary dark:text-revive-primary-dark">
              Claimed ✓
            </Text>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={claimDailyReward}
            className="rounded-full bg-revive-primary px-4 py-2 active:scale-95 dark:bg-revive-primary-dark">
            <Text className="text-[13px] font-bold text-white dark:text-revive-bg-dark">
              Claim +{reward} 🌿
            </Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}
