import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { FEATURES } from '@/constants/features';
import { useMainNavigation } from '@/components/navigation/NavigationContext';
import { DAILY_MISSIONS, MissionId } from '@/services/missionsService';
import { useGrowthStore } from '@/stores/growthStore';

type DailyMissionsSectionProps = {
  delay?: number;
};

type MissionAction =
  | { type: 'modal'; href: '/(modals)/daily-check-in' }
  | { type: 'tab'; tab: 'coach' | 'community' };

// Dashboard is itself a page inside the swipeable pager (not a route), so a
// mission that lands on Coach/Community switches tabs through the shared
// navigation context rather than pushing a route that no longer exists.
// `daily_checkin` is a real modal route, pushed normally.
const MISSION_ACTIONS: Partial<Record<MissionId, MissionAction>> = {
  daily_checkin: { type: 'modal', href: '/(modals)/daily-check-in' },
  talk_with_coach: { type: 'tab', tab: 'coach' },
  read_insight: { type: 'tab', tab: 'coach' },
  community_interaction: { type: 'tab', tab: 'community' },
};

/**
 * Daily Missions — six meaningful actions. Tapping one navigates to where
 * that action actually happens (completion is recorded by that screen, not
 * here); "Complete 5 Games" mirrors the playlist above and isn't tappable.
 */
export default function DailyMissionsSection({ delay = 0 }: DailyMissionsSectionProps) {
  const router = useRouter();
  const { goToTab } = useMainNavigation();
  const playlist = useGrowthStore((s) => s.todaysPlaylist);
  const missions = useGrowthStore((s) => s.dailyMissions);

  const gamesCompleted = useMemo(
    () => playlist.games.filter((g) => g.completed).length,
    [playlist],
  );

  // Community is gated behind a Coming Soon screen — hide the mission tied to
  // it rather than deleting it, so re-enabling Community brings it right back.
  const visibleMissions = useMemo(
    () =>
      FEATURES.communityEnabled
        ? DAILY_MISSIONS
        : DAILY_MISSIONS.filter((m) => m.id !== 'community_interaction'),
    [],
  );

  return (
    <View>
      <Animated.Text
        entering={FadeInDown.delay(delay).duration(450)}
        className="mb-3 text-xl font-semibold text-revive-ink dark:text-revive-ink-dark">
        Daily Missions
      </Animated.Text>

      {visibleMissions.map((mission, index) => {
        const done = missions.completed[mission.id] === true;
        const action = MISSION_ACTIONS[mission.id];
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

        const handlePress = () => {
          if (!action) return;
          if (action.type === 'modal') router.push(action.href);
          else goToTab(action.tab);
        };

        return (
          <Animated.View key={mission.id} entering={FadeInDown.delay(delay + 60 + index * 40).duration(400)}>
            {action && !done ? (
              <Pressable accessibilityRole="button" onPress={handlePress} className="active:opacity-85">
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
