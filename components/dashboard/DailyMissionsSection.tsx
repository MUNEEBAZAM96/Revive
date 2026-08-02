import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { DAILY_MISSIONS, MissionId } from '@/services/missionsService';
import { useGrowthStore } from '@/stores/growthStore';

type DailyMissionsSectionProps = {
  delay?: number;
};

const MISSION_ROUTES: Partial<Record<MissionId, '/(modals)/daily-check-in' | '/(tabs)/coach' | '/(tabs)/community'>> = {
  daily_checkin: '/(modals)/daily-check-in',
  talk_with_coach: '/(tabs)/coach',
  read_insight: '/(tabs)/coach',
  community_interaction: '/(tabs)/community',
};

/**
 * Daily Missions — six meaningful actions. Tapping one navigates to where
 * that action actually happens (completion is recorded by that screen, not
 * here); "Complete 5 Games" mirrors the playlist above and isn't tappable.
 */
export default function DailyMissionsSection({ delay = 0 }: DailyMissionsSectionProps) {
  const router = useRouter();
  const playlist = useGrowthStore((s) => s.todaysPlaylist);
  const missions = useGrowthStore((s) => s.dailyMissions);

  const gamesCompleted = useMemo(
    () => playlist.games.filter((g) => g.completed).length,
    [playlist],
  );

  return (
    <View>
      <Animated.Text
        entering={FadeInDown.delay(delay).duration(450)}
        className="mb-3 text-xl font-semibold text-revive-ink dark:text-revive-ink-dark">
        Daily Missions
      </Animated.Text>

      {DAILY_MISSIONS.map((mission, index) => {
        const done = missions.completed[mission.id] === true;
        const route = MISSION_ROUTES[mission.id];
        const isGamesMission = mission.id === 'complete_5_games';

        const content = (
          <View className="mb-2.5 flex-row items-center rounded-2xl bg-revive-card p-4 dark:bg-revive-card-dark">
            <Text className="text-2xl">{mission.emoji}</Text>
            <View className="ml-3 flex-1">
              <Text className="text-[15px] font-semibold text-revive-ink dark:text-revive-ink-dark">
                {mission.title}
              </Text>
              <Text className="text-[12px] text-revive-muted dark:text-revive-muted-dark">
                {isGamesMission ? `${gamesCompleted} of ${playlist.games.length} games` : mission.description}
              </Text>
            </View>
            <Text className="mr-2 text-[12px] font-bold text-revive-primary dark:text-revive-primary-dark">
              +{mission.reward}
            </Text>
            <View
              className={`h-7 w-7 items-center justify-center rounded-full ${
                done
                  ? 'bg-revive-primary dark:bg-revive-primary-dark'
                  : 'bg-revive-mist dark:bg-revive-mist-dark'
              }`}>
              <Text className={`text-[13px] font-bold ${done ? 'text-white' : 'text-revive-muted dark:text-revive-muted-dark'}`}>
                {done ? '✓' : '›'}
              </Text>
            </View>
          </View>
        );

        return (
          <Animated.View key={mission.id} entering={FadeInDown.delay(delay + 60 + index * 40).duration(400)}>
            {route && !done ? (
              <Pressable accessibilityRole="button" onPress={() => router.push(route)} className="active:opacity-85">
                {content}
              </Pressable>
            ) : (
              content
            )}
          </Animated.View>
        );
      })}
    </View>
  );
}
