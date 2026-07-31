import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import OnboardingScaffold from '@/components/OnboardingScaffold';
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
    <OnboardingScaffold
      step={2}
      ctaLabel="Next"
      onCtaPress={() => router.push('/(onboarding)/triggers')}>
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
              style={({ pressed }) => [
                styles.chip,
                isSelected && styles.chipSelected,
                pressed && styles.chipPressed,
              ]}
              onPress={() => toggleGoal(goal)}>
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {goal}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '700', color: palette.textPrimary },
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
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 11,
    backgroundColor: palette.surfaceMuted,
  },
  chipSelected: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  chipPressed: { transform: [{ scale: 0.96 }] },
  chipText: { color: palette.textPrimary, fontSize: 14 },
  chipTextSelected: { color: '#fff', fontWeight: '600' },
});
