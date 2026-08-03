import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import GamePlayModal from '@/components/games/GamePlayModal';
import DailyMissionsSection from '@/components/dashboard/DailyMissionsSection';
import DailyPlaylistSection from '@/components/dashboard/DailyPlaylistSection';
import DailyRewardStrip from '@/components/dashboard/DailyRewardStrip';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import RecoveryCheckInModal from '@/components/recovery/RecoveryCheckInModal';
import RecoveryStatusStrip from '@/components/recovery/RecoveryStatusStrip';
import { useBottomNavClearance } from '@/hooks/useBottomNavClearance';
import { useRecoveryCheckIn } from '@/hooks/useRecoveryCheckIn';
import type { GameType } from '@/services/dailyChallengeService';

const MOCK_NAME = 'Muneeb';

/**
 * The Revive home screen: a premium game-meets-wellness hub, not a habit
 * tracker. Deliberately minimal — profile + Revive Score + Diamonds, today's
 * 5-game playlist, daily missions, and the floating support button. Nothing
 * else: no calendar, no journal, no long statistics — those live in Journey.
 *
 * Lives under components/dashboard/ (not app/(tabs)/) because it's now a
 * page inside SwipePager rather than its own Expo Router route — see
 * components/navigation/MainNavigator.tsx.
 */
export default function DashboardScreen() {
  const [activeGame, setActiveGame] = useState<GameType | null>(null);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const bottomClearance = useBottomNavClearance();
  const { hasCheckedInToday } = useRecoveryCheckIn();

  // Recovery Check-In: shown once per app open when today isn't recorded yet.
  // Runs once on mount by design — it should never re-appear mid-session just
  // because a re-render happens, only the next time the Dashboard is opened.
  useEffect(() => {
    if (!hasCheckedInToday) setCheckInOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-revive-bg dark:bg-revive-bg-dark">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="px-5 pt-4"
        contentContainerStyle={{ paddingBottom: bottomClearance }}>
        <DashboardHeader name={MOCK_NAME} delay={0} />

        <View className="mt-6">
          <RecoveryStatusStrip delay={40} />
        </View>

        <View className="mt-4">
          <DailyRewardStrip delay={80} />
        </View>

        <View className="mt-8">
          <DailyPlaylistSection onSelectGame={setActiveGame} delay={160} />
        </View>

        <View className="mt-8">
          <DailyMissionsSection delay={280} />
        </View>
      </ScrollView>

      <GamePlayModal gameType={activeGame} onClose={() => setActiveGame(null)} />
      <RecoveryCheckInModal visible={checkInOpen} onClose={() => setCheckInOpen(false)} />
    </SafeAreaView>
  );
}
