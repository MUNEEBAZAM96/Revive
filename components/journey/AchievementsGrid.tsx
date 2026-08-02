import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ACHIEVEMENTS } from '@/services/achievementsService';
import { useGrowthStore } from '@/stores/growthStore';

/** Grid of the 9 named achievements — locked (dimmed) or unlocked (full color). */
export default function AchievementsGrid() {
  const unlocked = useGrowthStore((s) => s.unlockedAchievements);

  return (
    <View className="flex-row flex-wrap justify-between">
      {ACHIEVEMENTS.map((achievement, index) => {
        const isUnlocked = unlocked.includes(achievement.id);
        return (
          <Animated.View
            key={achievement.id}
            entering={FadeInDown.delay(index * 50).duration(400)}
            className="mb-3 w-[31%] items-center rounded-2xl bg-revive-card px-2 py-4 dark:bg-revive-card-dark">
            <Text className={`text-3xl ${isUnlocked ? '' : 'opacity-25'}`}>{achievement.emoji}</Text>
            <Text
              numberOfLines={2}
              className={`mt-2 text-center text-[12px] font-semibold ${
                isUnlocked
                  ? 'text-revive-ink dark:text-revive-ink-dark'
                  : 'text-revive-muted dark:text-revive-muted-dark'
              }`}>
              {achievement.title}
            </Text>
            <Text
              numberOfLines={2}
              className="mt-1 text-center text-[10px] text-revive-muted dark:text-revive-muted-dark">
              {isUnlocked ? achievement.description : '🔒 Locked'}
            </Text>
          </Animated.View>
        );
      })}
    </View>
  );
}
