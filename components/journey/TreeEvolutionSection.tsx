import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import GrowthProgress from '@/components/growth/GrowthProgress';
import TreeEvolution from '@/components/growth/TreeEvolution';
import { cosmeticById } from '@/services/cosmeticsService';
import { nextTreeStageFor, stageForLevel, titleForLevel } from '@/services/growthLevels';
import { useGrowthStore } from '@/stores/growthStore';

/** The large, celebratory version of the tree — the centerpiece of the Journey tab. */
export default function TreeEvolutionSection() {
  const level = useGrowthStore((s) => s.level);
  const reviveScore = useGrowthStore((s) => s.reviveScore);
  const equippedGardenTheme = useGrowthStore((s) => s.equippedCosmetics.garden_theme);

  const stage = stageForLevel(level);
  const next = nextTreeStageFor(level);
  const title = titleForLevel(level);
  const haloColor = cosmeticById(equippedGardenTheme)?.haloColor;

  return (
    <Animated.View entering={FadeInDown.duration(400)} className="items-center">
      <TreeEvolution level={level} size={200} haloColor={haloColor} />

      <Text className="mt-5 text-2xl font-bold text-revive-ink dark:text-revive-ink-dark">
        {stage.label}
      </Text>
      <Text className="mt-1 text-[13px] text-revive-muted dark:text-revive-muted-dark">
        Level {level} · {title.label}
      </Text>

      <View className="mt-6 w-full">
        <GrowthProgress growthEnergy={reviveScore} delay={200} />
      </View>

      {next && (
        <View className="mt-6 w-full rounded-2xl bg-revive-mist p-4 dark:bg-revive-mist-dark">
          <Text className="text-center text-[13px] text-revive-muted dark:text-revive-muted-dark">
            Next stage
          </Text>
          <Text className="mt-1 text-center text-lg font-semibold text-revive-ink dark:text-revive-ink-dark">
            {next.emoji} {next.label} at Level {next.fromLevel}
          </Text>
        </View>
      )}
    </Animated.View>
  );
}
