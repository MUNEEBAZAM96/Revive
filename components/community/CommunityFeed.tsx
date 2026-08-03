import { useCallback, useState } from 'react';
import { FlatList, ListRenderItem, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SPACING } from '@/constants/spacing';
import { useBottomNavClearance } from '@/hooks/useBottomNavClearance';
import { useGrowthStore } from '@/stores/growthStore';

/**
 * The real Community feed — fully built, currently gated off behind
 * `FEATURES.communityEnabled` (see components/community/CommunityScreen.tsx). Preserved as-is
 * rather than deleted, so re-enabling the feature is a one-line flag flip.
 */

type CommunityPost = {
  id: string;
  handle: string;
  time: string;
  text: string;
  hearts: number;
};

const PLACEHOLDER_POSTS: CommunityPost[] = [
  {
    id: '1',
    handle: 'QuietRiver42',
    time: '2h ago',
    text: '90 days today. A year ago I couldn’t imagine writing this sentence.',
    hearts: 48,
  },
  {
    id: '2',
    handle: 'SteadyOak',
    time: '5h ago',
    text: 'Rough weekend, but I used the panic button twice instead of relapsing. It helps.',
    hearts: 31,
  },
  {
    id: '3',
    handle: 'MorningLark',
    time: '1d ago',
    text: 'Tip: I moved my check-in to right after brushing my teeth. Streak is finally sticking.',
    hearts: 19,
  },
];

function ListHeader() {
  return (
    <>
      <Text className="text-[26px] font-bold text-revive-ink dark:text-revive-ink-dark">
        Community
      </Text>
      <Text className="mt-1.5 text-[13px] leading-5 text-revive-muted dark:text-revive-muted-dark">
        Everyone here is anonymous. Send encouragement — placeholder feed for now.
      </Text>
    </>
  );
}

export default function CommunityFeed() {
  const completeMission = useGrowthStore((s) => s.completeMission);
  const bottomClearance = useBottomNavClearance();
  const [hearted, setHearted] = useState<Set<string>>(new Set());

  const encourage = useCallback(
    (postId: string) => {
      if (hearted.has(postId)) return;
      setHearted((current) => new Set(current).add(postId));
      completeMission('community_interaction');
    },
    [hearted, completeMission],
  );

  const renderPost: ListRenderItem<CommunityPost> = useCallback(
    ({ item }) => {
      const isHearted = hearted.has(item.id);
      return (
        <View
          className="mt-3.5 rounded-3xl bg-revive-card p-4 dark:bg-revive-card-dark"
          style={{ boxShadow: '0px 4px 12px rgba(26, 58, 44, 0.06)' }}>
          <View className="flex-row items-center justify-between">
            <Text className="text-[14px] font-bold text-revive-primary dark:text-revive-primary-dark">
              @{item.handle}
            </Text>
            <Text className="text-[12px] text-revive-muted dark:text-revive-muted-dark">
              {item.time}
            </Text>
          </View>
          <Text className="mt-2 text-[15px] leading-6 text-revive-ink dark:text-revive-ink-dark">
            {item.text}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => encourage(item.id)}
            className="mt-3 flex-row items-center self-start active:opacity-80">
            <Text
              className={`text-[13px] ${
                isHearted
                  ? 'font-bold text-revive-primary dark:text-revive-primary-dark'
                  : 'text-revive-muted dark:text-revive-muted-dark'
              }`}>
              {isHearted ? '💚' : '🤍'} {item.hearts + (isHearted ? 1 : 0)}
            </Text>
            {isHearted && (
              <Text className="ml-2 text-[12px] font-medium text-revive-primary dark:text-revive-primary-dark">
                Encouraged
              </Text>
            )}
          </Pressable>
        </View>
      );
    },
    [hearted, encourage],
  );

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-revive-bg dark:bg-revive-bg-dark">
      <FlatList
        data={PLACEHOLDER_POSTS}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={{
          paddingHorizontal: SPACING.xl,
          paddingTop: SPACING.lg,
          paddingBottom: bottomClearance,
        }}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        initialNumToRender={10}
        windowSize={7}
        maxToRenderPerBatch={10}
        removeClippedSubviews
      />
    </SafeAreaView>
  );
}
