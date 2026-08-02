import { useMemo } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { TREE_STAGES } from '@/services/growthLevels';
import { useGrowthStore } from '@/stores/growthStore';

interface TimelineEntry {
  label: string;
  achieved: boolean;
}

const LEVEL_MILESTONES = [5, 10, 20, 35, 50];
const SCORE_MILESTONES = [100, 500, 1000, 5000, 10000];
const GAME_MILESTONES = [10, 50, 100, 500];

function TimelineRow({ entry, isLast }: { entry: TimelineEntry; isLast: boolean }) {
  return (
    <View className="flex-row">
      <View className="items-center" style={{ width: 24 }}>
        <View
          className={`h-4 w-4 rounded-full border-2 ${
            entry.achieved
              ? 'border-revive-primary bg-revive-primary dark:border-revive-primary-dark dark:bg-revive-primary-dark'
              : 'border-revive-mist bg-revive-bg dark:border-revive-mist-dark dark:bg-revive-bg-dark'
          }`}
        />
        {!isLast && <View className="w-0.5 flex-1 bg-revive-mist dark:bg-revive-mist-dark" />}
      </View>
      <View className="flex-1 pb-5 pl-3">
        <Text
          className={`text-[14px] ${
            entry.achieved
              ? 'font-semibold text-revive-ink dark:text-revive-ink-dark'
              : 'text-revive-muted dark:text-revive-muted-dark'
          }`}>
          {entry.label}
        </Text>
      </View>
    </View>
  );
}

/** A real, data-driven timeline of milestones — reached and upcoming. */
export default function RecoveryTimeline() {
  const level = useGrowthStore((s) => s.level);
  const lifetimeScore = useGrowthStore((s) => s.lifetimeScore);
  const lifetimeGamesCompleted = useGrowthStore((s) => s.lifetimeGamesCompleted);

  const entries = useMemo<TimelineEntry[]>(() => {
    const list: TimelineEntry[] = [{ label: 'Started Revive 🌱', achieved: true }];
    for (const lvl of LEVEL_MILESTONES) {
      list.push({ label: `Reached Level ${lvl}`, achieved: level >= lvl });
    }
    for (const stage of TREE_STAGES) {
      if (stage.fromLevel === 1) continue; // seed is the starting point
      list.push({ label: `${stage.label} unlocked ${stage.emoji}`, achieved: level >= stage.fromLevel });
    }
    for (const score of SCORE_MILESTONES) {
      list.push({ label: `Reached ${score.toLocaleString()} Score`, achieved: lifetimeScore >= score });
    }
    for (const games of GAME_MILESTONES) {
      list.push({ label: `Completed ${games} Games`, achieved: lifetimeGamesCompleted >= games });
    }
    return list;
  }, [level, lifetimeScore, lifetimeGamesCompleted]);

  return (
    <Animated.View entering={FadeInDown.duration(400)}>
      {entries.map((entry, index) => (
        <TimelineRow key={entry.label} entry={entry} isLast={index === entries.length - 1} />
      ))}
    </Animated.View>
  );
}
