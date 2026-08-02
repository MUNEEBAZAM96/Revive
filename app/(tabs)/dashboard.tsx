import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import GamePlayModal from '@/components/games/GamePlayModal';
import DailyMissionsSection from '@/components/dashboard/DailyMissionsSection';
import DailyPlaylistSection from '@/components/dashboard/DailyPlaylistSection';
import DailyRewardStrip from '@/components/dashboard/DailyRewardStrip';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import type { GameType } from '@/services/dailyChallengeService';

const MOCK_NAME = 'Muneeb';

/**
 * The Revive home screen: a premium game-meets-wellness hub, not a habit
 * tracker. Deliberately minimal — profile + Revive Score + Diamonds, today's
 * 5-game playlist, daily missions, a daily reward, and the floating support
 * button. Nothing else: no calendar, no journal, no long statistics — those
 * live in the Journey tab.
 */
export default function DashboardScreen() {
  const [activeGame, setActiveGame] = useState<GameType | null>(null);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-revive-bg dark:bg-revive-bg-dark">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="px-5 pb-36 pt-4">
        <DashboardHeader name={MOCK_NAME} delay={0} />

        <View className="mt-6">
          <DailyRewardStrip delay={80} />
        </View>

        <View className="mt-7">
          <DailyPlaylistSection onSelectGame={setActiveGame} delay={160} />
        </View>

        <View className="mt-7">
          <DailyMissionsSection delay={280} />
        </View>
      </ScrollView>

      <GamePlayModal gameType={activeGame} onClose={() => setActiveGame(null)} />
    </SafeAreaView>
  );
}
