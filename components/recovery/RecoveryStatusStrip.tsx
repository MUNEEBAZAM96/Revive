import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useRecoveryCheckIn } from '@/hooks/useRecoveryCheckIn';
import { STATUS_META } from '@/services/checkInService';

type RecoveryStatusStripProps = {
  delay?: number;
};

/**
 * A single-glance recovery summary — streak, score, today's status — updated
 * the instant a check-in is submitted (it reads straight from the store, no
 * refresh needed). Deliberately one compact row, not a new dashboard section.
 */
export default function RecoveryStatusStrip({ delay = 0 }: RecoveryStatusStripProps) {
  const { currentStreak, recoveryScore, todayCheckIn } = useRecoveryCheckIn();
  const todayMeta = todayCheckIn ? STATUS_META[todayCheckIn.status] : null;

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(450)}>
      <View className="flex-row items-center justify-between rounded-2xl bg-revive-mist px-4 py-3.5 dark:bg-revive-mist-dark">
        <View className="flex-row items-center">
          <Text className="text-lg">🔥</Text>
          <Text className="ml-1.5 text-[14px] font-semibold text-revive-ink dark:text-revive-ink-dark">
            {currentStreak}d streak
          </Text>
        </View>

        <View className="h-6 w-px bg-revive-secondary/40" />

        <View className="flex-row items-center">
          <Text className="text-lg">📊</Text>
          <Text className="ml-1.5 text-[14px] font-semibold text-revive-ink dark:text-revive-ink-dark">
            {recoveryScore}%
          </Text>
        </View>

        <View className="h-6 w-px bg-revive-secondary/40" />

        {todayMeta ? (
          <View className="flex-row items-center">
            <Text className="text-lg">{todayMeta.emoji}</Text>
          </View>
        ) : (
          <Text className="text-[12px] text-revive-muted dark:text-revive-muted-dark">
            Not checked in
          </Text>
        )}
      </View>
    </Animated.View>
  );
}
