import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { titleForLevel } from '@/services/growthLevels';
import type { GameCompletionSummary } from '@/stores/growthStore';

import GameAnimation from './GameAnimation';
import GameReward from './GameReward';

type GameResultProps = {
  summary: GameCompletionSummary;
  gameTitle: string;
  onContinue: () => void;
};

/**
 * The completion celebration — shown after any game (or the daily-playlist
 * bonus) finishes. Restrained by design: a soft leaf animation, clear reward
 * chips, and quiet acknowledgment of level-ups or new achievements.
 */
export default function GameResult({ summary, gameTitle, onContinue }: GameResultProps) {
  return (
    <Animated.View entering={FadeIn.duration(400)} className="items-center pt-4">
      <View className="relative h-24 w-24 items-center justify-center">
        <View className="h-24 w-24 items-center justify-center rounded-full bg-revive-mist dark:bg-revive-mist-dark">
          <Text className="text-5xl">🌿</Text>
        </View>
        <GameAnimation celebrate={summary.leveledUp} />
      </View>

      <Text className="mt-5 text-2xl font-bold text-revive-ink dark:text-revive-ink-dark">
        Challenge Complete
      </Text>
      <Text className="mt-2 text-center text-base leading-6 text-revive-muted dark:text-revive-muted-dark">
        {gameTitle} — your mind became stronger today.
      </Text>

      <View className="mt-5 flex-row gap-2">
        <GameReward icon="🌿" amount={summary.earned} animated delay={150} />
        {summary.diamondsEarned > 0 && (
          <GameReward icon="💎" amount={summary.diamondsEarned} animated delay={300} />
        )}
      </View>

      <View className="mt-5 w-full rounded-2xl bg-revive-mist p-4 dark:bg-revive-mist-dark">
        <Text className="text-center text-[13px] text-revive-muted dark:text-revive-muted-dark">
          Tree Growing
        </Text>
        <Text className="mt-1 text-center text-base font-semibold text-revive-ink dark:text-revive-ink-dark">
          {summary.leveledUp
            ? `Level up! Now Level ${summary.level} · ${titleForLevel(summary.level).label}`
            : `+${summary.growthPercent}% growth`}
        </Text>
      </View>

      {summary.allGamesComplete && (
        <Animated.View
          entering={FadeIn.delay(400).duration(400)}
          className="mt-3 w-full items-center rounded-2xl bg-revive-secondary/30 p-3 dark:bg-revive-primary-dark/20">
          <Text className="text-[13px] font-semibold text-revive-primary dark:text-revive-primary-dark">
            🎉 All 5 games complete — playlist bonus earned!
          </Text>
        </Animated.View>
      )}

      {summary.newAchievements.length > 0 && (
        <View className="mt-3 w-full">
          {summary.newAchievements.map((a) => (
            <Animated.View
              key={a.id}
              entering={FadeIn.delay(500).duration(400)}
              className="mb-2 flex-row items-center rounded-2xl bg-revive-card p-3 dark:bg-revive-card-dark">
              <Text className="text-2xl">{a.emoji}</Text>
              <View className="ml-3 flex-1">
                <Text className="text-[13px] font-bold text-revive-ink dark:text-revive-ink-dark">
                  Achievement unlocked: {a.title}
                </Text>
                <Text className="text-[12px] text-revive-muted dark:text-revive-muted-dark">
                  {a.description}
                </Text>
              </View>
            </Animated.View>
          ))}
        </View>
      )}

      <Pressable
        accessibilityRole="button"
        onPress={onContinue}
        className="mt-6 w-full items-center rounded-2xl bg-revive-primary py-4 active:scale-95 dark:bg-revive-primary-dark">
        <Text className="text-base font-bold text-white dark:text-revive-bg-dark">Continue</Text>
      </Pressable>
    </Animated.View>
  );
}
