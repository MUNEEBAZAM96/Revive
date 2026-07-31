import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import DailyFocusCard from '@/components/dashboard/DailyFocusCard';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import RecoveryGardenCard from '@/components/dashboard/RecoveryGardenCard';
import ReflectionCard from '@/components/dashboard/ReflectionCard';
import { gardenSummary } from '@/components/dashboard/gardenData';
import { mockDashboard } from '@/components/dashboard/theme';

/**
 * The Revive home screen: a personal recovery space, not a stats dashboard.
 * Cards enter one by one; all data is mock until Supabase is wired up.
 */
export default function DashboardScreen() {
  const router = useRouter();

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-revive-bg dark:bg-revive-bg-dark">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="px-5 pb-36 pt-4">
        <DashboardHeader daysGrowing={gardenSummary.growthDays} delay={0} />

        <View className="mt-7">
          <DailyFocusCard
            focus={mockDashboard.todayFocus}
            delay={120}
            onStart={() => router.push('/(modals)/daily-check-in')}
          />
        </View>

        <View className="mt-5">
          <RecoveryGardenCard delay={240} />
        </View>
        <View className="mt-5">
          <ReflectionCard delay={600} onWrite={() => router.push('/(modals)/daily-check-in')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
