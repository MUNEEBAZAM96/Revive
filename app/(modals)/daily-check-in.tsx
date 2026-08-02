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

import { MOOD_OPTIONS } from '@/components/dashboard/garden';
import { palette } from '@/constants/Colors';
import type { DayStatus, Mood } from '@/database/schema';
import { useDataStore } from '@/stores/dataStore';
import { useGrowthStore } from '@/stores/growthStore';

const URGE_LEVELS = [1, 2, 3, 4, 5];

// Calm rain-blue for storm days — deliberately never red (no shame framing).
const STORM_INK = '#5E7C91';
const STORM_CHIP = '#E9F0F4';

export default function DailyCheckInScreen() {
  const router = useRouter();
  const saveCheckin = useDataStore((s) => s.saveCheckin);
  const completeMission = useGrowthStore((s) => s.completeMission);
  const [dayStatus, setDayStatus] = useState<DayStatus | null>(null);
  const [mood, setMood] = useState<Mood | null>(null);
  const [urge, setUrge] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  // Persist to the local-first store (SQLite + sync queue). A day with no
  // explicit status counts as growth.
  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await saveCheckin({
        mood,
        urge_level: urge,
        reflection_note: note.trim() ? note.trim() : null,
        day_status: dayStatus ?? 'growth',
      });
      completeMission('daily_checkin');
    } finally {
      setSaving(false);
      router.back();
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>How are you today?</Text>

      <Text style={styles.sectionTitle}>How did today go?</Text>
      <View style={styles.dayStatusRow}>
        <Pressable
          style={[
            styles.dayStatusOption,
            dayStatus === 'growth' && styles.dayStatusGrowthSelected,
          ]}
          onPress={() => setDayStatus('growth')}>
          <Text style={styles.dayStatusEmoji}>🌿</Text>
          <Text
            style={[
              styles.dayStatusLabel,
              dayStatus === 'growth' && { color: palette.primary, fontWeight: '700' },
            ]}>
            Growing
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.dayStatusOption,
            dayStatus === 'storm' && styles.dayStatusStormSelected,
          ]}
          onPress={() => setDayStatus('storm')}>
          <Text style={styles.dayStatusEmoji}>⛈️</Text>
          <Text
            style={[
              styles.dayStatusLabel,
              dayStatus === 'storm' && { color: STORM_INK, fontWeight: '700' },
            ]}>
            A storm passed
          </Text>
        </Pressable>
      </View>
      {dayStatus === 'storm' && (
        <Text style={styles.stormHint}>
          A storm never resets your garden — it simply pauses growth for today.
          Be kind to yourself; you showed up, and that counts.
        </Text>
      )}

      <Text style={styles.sectionTitle}>Mood</Text>
      <View style={styles.moodRow}>
        {MOOD_OPTIONS.map((option) => {
          const isSelected = mood === option.value;
          return (
            <Pressable
              key={option.value}
              style={[styles.moodItem, isSelected && styles.moodItemSelected]}
              onPress={() => setMood(option.value)}>
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

      <Pressable
        style={[styles.primaryButton, saving && styles.primaryButtonDisabled]}
        disabled={saving}
        onPress={handleSave}>
        <Text style={styles.primaryButtonText}>
          {saving ? 'Saving…' : 'Save check-in'}
        </Text>
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
  dayStatusRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  dayStatusOption: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 16,
    paddingVertical: 14,
    backgroundColor: palette.surfaceMuted,
  },
  dayStatusGrowthSelected: { borderColor: palette.primary, backgroundColor: '#e7f4f2' },
  dayStatusStormSelected: { borderColor: STORM_INK, backgroundColor: STORM_CHIP },
  dayStatusEmoji: { fontSize: 24 },
  dayStatusLabel: { fontSize: 13, color: palette.textSecondary, marginTop: 4 },
  stormHint: {
    fontSize: 13,
    color: STORM_INK,
    marginTop: 10,
    lineHeight: 19,
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
    width: 74,
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
  primaryButtonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
