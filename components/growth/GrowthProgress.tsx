import { Text, View } from 'react-native';

import AnimatedProgress from '@/components/dashboard/AnimatedProgress';
import { levelProgress } from '@/services/growthLevels';

type GrowthProgressProps = {
  growthEnergy: number;
  delay?: number;
};

/**
 * Growth Energy toward the next level — a calm filling bar with "current /
 * needed" beneath it. Reuses the dashboard's AnimatedProgress for a consistent,
 * gently-animated fill.
 */
export default function GrowthProgress({ growthEnergy, delay = 300 }: GrowthProgressProps) {
  const { current, needed, progress, level } = levelProgress(growthEnergy);
  const atMax = needed === 0;

  return (
    <View>
      <AnimatedProgress progress={atMax ? 1 : progress} delay={delay} height={8} />
      <View className="mt-1.5 flex-row items-center justify-between">
        <Text className="text-[12px] text-revive-muted dark:text-revive-muted-dark">
          Growth Energy
        </Text>
        <Text className="text-[12px] font-semibold text-revive-primary dark:text-revive-primary-dark">
          {atMax ? `Level ${level} — fully grown` : `${current} / ${needed}`}
        </Text>
      </View>
    </View>
  );
}
