import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { ACHIEVEMENTS } from '@/services/achievementsService';
import {
  CosmeticCategory,
  CosmeticItem,
  itemsInCategory,
} from '@/services/cosmeticsService';
import { useGrowthStore } from '@/stores/growthStore';

const CATEGORIES: { id: CosmeticCategory; label: string; emoji: string }[] = [
  { id: 'garden_theme', label: 'Garden Themes', emoji: '🌳' },
  { id: 'profile_frame', label: 'Profile Frames', emoji: '🖼️' },
  { id: 'app_theme', label: 'App Themes', emoji: '🎨' },
  { id: 'badge', label: 'Badges', emoji: '🏅' },
];

function achievementFor(id?: string) {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

function Swatch({ item }: { item: CosmeticItem }) {
  if (item.category === 'badge') {
    const achievement = achievementFor(item.achievementId);
    return <Text className="text-3xl">{achievement?.emoji ?? '🏅'}</Text>;
  }
  const color = item.haloColor ?? item.accentColor ?? '#A8D5BA';
  return (
    <View
      className="h-10 w-10 rounded-full"
      style={
        item.category === 'profile_frame'
          ? { borderWidth: 4, borderColor: color === 'transparent' ? '#A8D5BA55' : color }
          : { backgroundColor: color }
      }
    />
  );
}

/** Diamonds unlock cosmetics; badges are earned free from achievements. */
export default function RewardsShopScreen() {
  const diamonds = useGrowthStore((s) => s.diamonds);
  const unlockedCosmetics = useGrowthStore((s) => s.unlockedCosmetics);
  const equippedCosmetics = useGrowthStore((s) => s.equippedCosmetics);
  const purchaseCosmetic = useGrowthStore((s) => s.purchaseCosmetic);
  const equipCosmetic = useGrowthStore((s) => s.equipCosmetic);

  const [category, setCategory] = useState<CosmeticCategory>('garden_theme');
  const items = itemsInCategory(category);

  return (
    <ScrollView
      className="flex-1 bg-revive-bg dark:bg-revive-bg-dark"
      contentContainerClassName="px-5 pb-16 pt-4"
      showsVerticalScrollIndicator={false}>
      <View className="flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-revive-ink dark:text-revive-ink-dark">
          Rewards Shop
        </Text>
        <View className="flex-row items-center rounded-full bg-revive-mist px-3 py-1.5 dark:bg-revive-mist-dark">
          <Text className="text-sm">💎</Text>
          <Text className="ml-1 text-sm font-bold text-revive-ink dark:text-revive-ink-dark">
            {diamonds}
          </Text>
        </View>
      </View>
      <Text className="mt-1 text-[13px] text-revive-muted dark:text-revive-muted-dark">
        Diamonds are earned, never bought — from completing your daily playlist, streaks, and
        achievements.
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 py-4">
        {CATEGORIES.map((c) => {
          const active = category === c.id;
          return (
            <Pressable
              key={c.id}
              accessibilityRole="button"
              onPress={() => setCategory(c.id)}
              className={`flex-row items-center rounded-full px-4 py-2.5 active:opacity-85 ${
                active ? 'bg-revive-primary dark:bg-revive-primary-dark' : 'bg-revive-mist dark:bg-revive-mist-dark'
              }`}>
              <Text className="text-sm">{c.emoji}</Text>
              <Text
                className={`ml-1.5 text-[13px] font-semibold ${
                  active ? 'text-white dark:text-revive-bg-dark' : 'text-revive-ink dark:text-revive-ink-dark'
                }`}>
                {c.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {items.map((item) => {
        const isUnlocked = unlockedCosmetics.includes(item.id);
        // Narrowed outside the closures below — TS doesn't retain a ternary's
        // narrowing of `item.category` across an arrow-function boundary.
        const equipCategory = item.category !== 'badge' ? item.category : null;
        const isEquipped = equipCategory !== null && equippedCosmetics[equipCategory] === item.id;
        const canAfford = diamonds >= item.diamondCost;

        return (
          <View
            key={item.id}
            className="mb-3 flex-row items-center rounded-2xl bg-revive-card p-4 dark:bg-revive-card-dark">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-revive-mist dark:bg-revive-mist-dark">
              <Swatch item={item} />
            </View>
            <View className="ml-3.5 flex-1">
              <Text className="text-[15px] font-semibold text-revive-ink dark:text-revive-ink-dark">
                {item.name}
              </Text>
              <Text className="text-[12px] text-revive-muted dark:text-revive-muted-dark">
                {item.category === 'badge'
                  ? isUnlocked
                    ? 'Earned'
                    : 'Unlocks with its achievement'
                  : isUnlocked
                    ? 'Unlocked'
                    : `💎 ${item.diamondCost}`}
              </Text>
            </View>

            {item.category === 'badge' ? (
              isUnlocked && (
                <Text className="text-[13px] font-semibold text-revive-primary dark:text-revive-primary-dark">
                  ✓
                </Text>
              )
            ) : isEquipped ? (
              <View className="rounded-full bg-revive-primary px-3.5 py-2 dark:bg-revive-primary-dark">
                <Text className="text-[12px] font-bold text-white dark:text-revive-bg-dark">Equipped</Text>
              </View>
            ) : isUnlocked && equipCategory ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => equipCosmetic(equipCategory, item.id)}
                className="rounded-full bg-revive-mist px-3.5 py-2 active:opacity-85 dark:bg-revive-mist-dark">
                <Text className="text-[12px] font-bold text-revive-primary dark:text-revive-primary-dark">
                  Equip
                </Text>
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                disabled={!canAfford}
                onPress={() => purchaseCosmetic(item.id)}
                className={`rounded-full px-3.5 py-2 active:opacity-85 ${
                  canAfford ? 'bg-revive-primary dark:bg-revive-primary-dark' : 'bg-revive-mist dark:bg-revive-mist-dark'
                }`}>
                <Text
                  className={`text-[12px] font-bold ${
                    canAfford ? 'text-white dark:text-revive-bg-dark' : 'text-revive-muted dark:text-revive-muted-dark'
                  }`}>
                  Unlock
                </Text>
              </Pressable>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}
