import { useCallback, useState } from 'react';
import { FlatList, ListRenderItem, Pressable, StyleSheet, Text, View } from 'react-native';

import { palette } from '@/constants/Colors';
import { useGrowthStore } from '@/stores/growthStore';

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
      <Text style={styles.title}>Community</Text>
      <Text style={styles.subtitle}>
        Everyone here is anonymous. Send encouragement — placeholder feed for now.
      </Text>
    </>
  );
}

export default function CommunityScreen() {
  const completeMission = useGrowthStore((s) => s.completeMission);
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
        <View style={styles.postCard}>
          <View style={styles.postHeader}>
            <Text style={styles.handle}>@{item.handle}</Text>
            <Text style={styles.time}>{item.time}</Text>
          </View>
          <Text style={styles.postText}>{item.text}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => encourage(item.id)}
            style={styles.heartRow}>
            <Text style={[styles.hearts, isHearted && styles.heartsActive]}>
              {isHearted ? '💚' : '🤍'} {item.hearts + (isHearted ? 1 : 0)}
            </Text>
            {isHearted && <Text style={styles.heartedLabel}>Encouraged</Text>}
          </Pressable>
        </View>
      );
    },
    [hearted, encourage],
  );

  return (
    <FlatList
      style={styles.screen}
      data={PLACEHOLDER_POSTS}
      keyExtractor={(item) => item.id}
      renderItem={renderPost}
      ListHeaderComponent={ListHeader}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
      initialNumToRender={10}
      windowSize={7}
      maxToRenderPerBatch={10}
      removeClippedSubviews
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.surfaceMuted },
  content: { padding: 20, paddingBottom: 120 },
  title: { fontSize: 24, fontWeight: '700', color: palette.textPrimary },
  subtitle: { fontSize: 14, color: palette.textSecondary, marginTop: 6 },
  postCard: {
    backgroundColor: palette.surface,
    borderRadius: 14,
    padding: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: palette.border,
  },
  postHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  handle: { fontSize: 14, fontWeight: '700', color: palette.primary },
  time: { fontSize: 13, color: palette.textSecondary },
  postText: { fontSize: 15, color: palette.textPrimary, marginTop: 8, lineHeight: 22 },
  heartRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  hearts: { fontSize: 13, color: palette.textSecondary },
  heartsActive: { color: palette.primary, fontWeight: '700' },
  heartedLabel: { fontSize: 12, color: palette.primary, marginLeft: 8 },
});
