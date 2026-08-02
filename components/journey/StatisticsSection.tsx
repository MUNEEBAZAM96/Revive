import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { titleForLevel } from '@/services/growthLevels';
import { useGrowthStore } from '@/stores/growthStore';

function Stat({ label, value, delay }: { label: string; value: string | number; delay: number }) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(400)}
      className="mb-3 w-[48%] rounded-2xl bg-revive-card p-4 dark:bg-revive-card-dark">
      <Text className="text-2xl font-extrabold text-revive-primary dark:text-revive-primary-dark">
        {value}
      </Text>
      <Text className="mt-1 text-[12px] text-revive-muted dark:text-revive-muted-dark">{label}</Text>
    </Animated.View>
  );
}

/** Real numbers only — every stat here is a field the store actually tracks. */
export default function StatisticsSection() {
  const level = useGrowthStore((s) => s.level);
  const reviveScore = useGrowthStore((s) => s.reviveScore);
  const lifetimeScore = useGrowthStore((s) => s.lifetimeScore);
  const diamonds = useGrowthStore((s) => s.diamonds);
  const currentStreak = useGrowthStore((s) => s.currentStreak);
  const longestStreak = useGrowthStore((s) => s.longestStreak);
  const lifetimeGamesCompleted = useGrowthStore((s) => s.lifetimeGamesCompleted);
  const unlockedAchievements = useGrowthStore((s) => s.unlockedAchievements);

  const title = titleForLevel(level);

  return (
    <View className="flex-row flex-wrap justify-between">
      <Stat label="Current Level" value={`${level} · ${title.label}`} delay={0} />
      <Stat label="Lifetime Score" value={lifetimeScore.toLocaleString()} delay={50} />
      <Stat label="Current Score" value={reviveScore.toLocaleString()} delay={100} />
      <Stat label="Diamonds" value={diamonds} delay={150} />
      <Stat label="Games Played" value={lifetimeGamesCompleted} delay={200} />
      <Stat label="Achievements" value={`${unlockedAchievements.length} / 9`} delay={250} />
      <Stat label="Current Streak" value={`${currentStreak} days`} delay={300} />
      <Stat label="Longest Streak" value={`${longestStreak} days`} delay={350} />
    </View>
  );
}
