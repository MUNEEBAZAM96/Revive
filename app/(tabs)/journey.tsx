import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import JourneyCalendar from '@/components/dashboard/JourneyCalendar';
import AchievementsGrid from '@/components/journey/AchievementsGrid';
import RecoveryTimeline from '@/components/journey/RecoveryTimeline';
import StatisticsSection from '@/components/journey/StatisticsSection';
import TreeEvolutionSection from '@/components/journey/TreeEvolutionSection';
import { useBottomNavClearance } from '@/hooks/useBottomNavClearance';

type Section = 'calendar' | 'achievements' | 'timeline' | 'statistics' | 'tree';

const SECTIONS: { id: Section; label: string; emoji: string }[] = [
  { id: 'calendar', label: 'Calendar', emoji: '📅' },
  { id: 'achievements', label: 'Achievements', emoji: '🏆' },
  { id: 'timeline', label: 'Timeline', emoji: '🕰️' },
  { id: 'statistics', label: 'Statistics', emoji: '📊' },
  { id: 'tree', label: 'Tree', emoji: '🌳' },
];

/**
 * Journey — personal progress and history, NOT gameplay. Replaces the old
 * Journal tab. A segmented control switches between five substantial
 * sections rather than one long scroll, closer to how Apple Health organizes
 * dense progress data.
 */
export default function JourneyScreen() {
  const [section, setSection] = useState<Section>('calendar');
  const bottomClearance = useBottomNavClearance();

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-revive-bg dark:bg-revive-bg-dark">
      <View className="px-5 pt-4">
        <Text className="text-[26px] font-bold text-revive-ink dark:text-revive-ink-dark">
          Your Journey
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 px-5 py-4">
        {SECTIONS.map((s) => {
          const active = section === s.id;
          return (
            <Pressable
              key={s.id}
              accessibilityRole="button"
              onPress={() => setSection(s.id)}
              className={`flex-row items-center rounded-full px-4 py-2.5 active:opacity-85 ${
                active
                  ? 'bg-revive-primary dark:bg-revive-primary-dark'
                  : 'bg-revive-mist dark:bg-revive-mist-dark'
              }`}>
              <Text className="text-sm">{s.emoji}</Text>
              <Text
                className={`ml-1.5 text-[13px] font-semibold ${
                  active ? 'text-white dark:text-revive-bg-dark' : 'text-revive-ink dark:text-revive-ink-dark'
                }`}>
                {s.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="px-5"
        contentContainerStyle={{ paddingBottom: bottomClearance }}>
        {section === 'calendar' && <JourneyCalendar />}
        {section === 'achievements' && <AchievementsGrid />}
        {section === 'timeline' && <RecoveryTimeline />}
        {section === 'statistics' && <StatisticsSection />}
        {section === 'tree' && <TreeEvolutionSection />}
      </ScrollView>
    </SafeAreaView>
  );
}
