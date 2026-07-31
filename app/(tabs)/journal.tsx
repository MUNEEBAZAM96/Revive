import { useCallback } from 'react';
import { FlatList, ListRenderItem, Pressable, StyleSheet, Text, View } from 'react-native';

import { palette } from '@/constants/Colors';

type JournalEntry = { id: string; date: string; preview: string };

const PLACEHOLDER_ENTRIES: JournalEntry[] = [
  { id: '1', date: 'Yesterday', preview: 'Rough afternoon but I called my sponsor instead…' },
  { id: '2', date: 'Monday', preview: 'Slept well for the first time in a week. Small wins.' },
  { id: '3', date: 'Last Friday', preview: 'Skipped the party. Proud of myself, honestly.' },
];

function ListHeader() {
  return (
    <>
      <Text style={styles.title}>Private Journal</Text>
      <Text style={styles.subtitle}>
        Only you can read these. Entries are placeholders for now.
      </Text>
    </>
  );
}

export default function JournalScreen() {
  const renderEntry: ListRenderItem<JournalEntry> = useCallback(
    ({ item }) => (
      <Pressable style={styles.entryCard}>
        <Text style={styles.entryDate}>{item.date}</Text>
        <Text style={styles.entryPreview} numberOfLines={2}>
          {item.preview}
        </Text>
      </Pressable>
    ),
    []
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={PLACEHOLDER_ENTRIES}
        keyExtractor={(item) => item.id}
        renderItem={renderEntry}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        initialNumToRender={10}
        windowSize={7}
        maxToRenderPerBatch={10}
        removeClippedSubviews
      />

      <Pressable style={styles.newEntryButton}>
        <Text style={styles.newEntryText}>＋ New entry</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.surfaceMuted },
  content: { padding: 20, paddingBottom: 160 },
  title: { fontSize: 24, fontWeight: '700', color: palette.textPrimary },
  subtitle: { fontSize: 14, color: palette.textSecondary, marginTop: 6 },
  entryCard: {
    backgroundColor: palette.surface,
    borderRadius: 14,
    padding: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: palette.border,
  },
  entryDate: { fontSize: 13, fontWeight: '600', color: palette.primary },
  entryPreview: { fontSize: 15, color: palette.textPrimary, marginTop: 6, lineHeight: 21 },
  newEntryButton: {
    position: 'absolute',
    left: 20,
    bottom: 24,
    backgroundColor: palette.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 22,
  },
  newEntryText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
