import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { palette } from '@/constants/Colors';

const MOODS = [
  { emoji: '😞', label: 'Low' },
  { emoji: '😕', label: 'Meh' },
  { emoji: '😐', label: 'Okay' },
  { emoji: '🙂', label: 'Good' },
  { emoji: '😄', label: 'Great' },
];

const URGE_LEVELS = [1, 2, 3, 4, 5];

export default function DailyCheckInScreen() {
  const router = useRouter();
  const [mood, setMood] = useState<string | null>(null);
  const [urge, setUrge] = useState<number | null>(null);
  const [note, setNote] = useState('');

  // Placeholder save: persist to real storage/backend later.
  const handleSave = () => {
    router.back();
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>How are you today?</Text>

      <Text style={styles.sectionTitle}>Mood</Text>
      <View style={styles.moodRow}>
        {MOODS.map((option) => {
          const isSelected = mood === option.label;
          return (
            <Pressable
              key={option.label}
              style={[styles.moodItem, isSelected && styles.moodItemSelected]}
              onPress={() => setMood(option.label)}>
              <Text style={styles.moodEmoji}>{option.emoji}</Text>
              <Text
                style={[styles.moodLabel, isSelected && styles.moodLabelSelected]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.sectionTitle}>Urge intensity</Text>
      <View style={styles.urgeRow}>
        {URGE_LEVELS.map((level) => {
          const isSelected = urge === level;
          return (
            <Pressable
              key={level}
              style={[styles.urgeDot, isSelected && styles.urgeDotSelected]}
              onPress={() => setUrge(level)}>
              <Text style={[styles.urgeText, isSelected && styles.urgeTextSelected]}>
                {level}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.sectionTitle}>Anything on your mind?</Text>
      <TextInput
        style={styles.noteInput}
        placeholder="Optional note to yourself…"
        placeholderTextColor={palette.textSecondary}
        multiline
        value={note}
        onChangeText={setNote}
      />

      <Pressable style={styles.primaryButton} onPress={handleSave}>
        <Text style={styles.primaryButtonText}>Save check-in</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.surface },
  content: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: '700', color: palette.textPrimary },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.textPrimary,
    marginTop: 24,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  moodItem: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 12,
    paddingVertical: 10,
    width: 60,
    backgroundColor: palette.surfaceMuted,
  },
  moodItemSelected: { borderColor: palette.primary, backgroundColor: '#e7f4f2' },
  moodEmoji: { fontSize: 24 },
  moodLabel: { fontSize: 12, color: palette.textSecondary, marginTop: 4 },
  moodLabelSelected: { color: palette.primary, fontWeight: '700' },
  urgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  urgeDot: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  urgeDotSelected: { backgroundColor: palette.primary, borderColor: palette.primary },
  urgeText: { fontSize: 18, color: palette.textPrimary },
  urgeTextSelected: { color: '#fff', fontWeight: '700' },
  noteInput: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 12,
    padding: 14,
    minHeight: 100,
    fontSize: 15,
    color: palette.textPrimary,
    backgroundColor: palette.surfaceMuted,
    marginTop: 12,
    textAlignVertical: 'top',
  },
  primaryButton: {
    backgroundColor: palette.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 28,
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
