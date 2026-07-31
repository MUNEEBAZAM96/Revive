import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { palette } from '@/constants/Colors';

const GOAL_OPTIONS = [
  'Stay completely abstinent',
  'Cut back gradually',
  'Understand my patterns',
  'Rebuild relationships',
  'Improve my health',
  'Save money',
];

export default function GoalsScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);

  const toggleGoal = (goal: string) => {
    setSelected((current) =>
      current.includes(goal)
        ? current.filter((item) => item !== goal)
        : [...current, goal]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>What does recovery mean to you?</Text>
      <Text style={styles.body}>
        Pick everything that applies. You can change these any time in
        Settings.
      </Text>

      <View style={styles.chipWrap}>
        {GOAL_OPTIONS.map((goal) => {
          const isSelected = selected.includes(goal);
          return (
            <Pressable
              key={goal}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => toggleGoal(goal)}>
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {goal}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        style={styles.primaryButton}
        onPress={() => router.push('/(onboarding)/triggers')}>
        <Text style={styles.primaryButtonText}>Next</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.surface,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  title: { fontSize: 24, fontWeight: '700', color: palette.textPrimary },
  body: {
    fontSize: 15,
    color: palette.textSecondary,
    marginTop: 12,
    lineHeight: 22,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 28,
  },
  chip: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: palette.surfaceMuted,
  },
  chipSelected: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  chipText: { color: palette.textPrimary, fontSize: 14 },
  chipTextSelected: { color: '#fff', fontWeight: '600' },
  primaryButton: {
    backgroundColor: palette.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 32,
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
