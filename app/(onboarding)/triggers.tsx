import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import OnboardingScaffold from '@/components/OnboardingScaffold';
import { palette } from '@/constants/Colors';

const SEVERITY_LEVELS = [1, 2, 3, 4, 5];

const TRIGGER_OPTIONS = [
  'Stress at work',
  'Loneliness',
  'Social events',
  'Boredom',
  'Conflict at home',
  'Sleep problems',
];

export default function TriggersScreen() {
  const router = useRouter();
  const [severity, setSeverity] = useState<number | null>(null);
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);

  const toggleTrigger = (trigger: string) => {
    setSelectedTriggers((current) =>
      current.includes(trigger)
        ? current.filter((item) => item !== trigger)
        : [...current, trigger]
    );
  };

  return (
    <OnboardingScaffold
      step={3}
      ctaLabel="Next"
      onCtaPress={() => router.push('/(onboarding)/disclaimer')}>
      <Text style={styles.title}>How would you rate things right now?</Text>
      <Text style={styles.body}>
        1 means it rarely affects your day, 5 means it feels overwhelming. This
        is only used to personalize the app.
      </Text>

      <View style={styles.severityRow}>
        {SEVERITY_LEVELS.map((level) => {
          const isSelected = severity === level;
          return (
            <Pressable
              key={level}
              style={({ pressed }) => [
                styles.severityDot,
                isSelected && styles.severityDotSelected,
                pressed && styles.pressed,
              ]}
              onPress={() => setSeverity(level)}>
              <Text
                style={[styles.severityText, isSelected && styles.severityTextSelected]}>
                {level}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.sectionTitle}>What tends to trigger you?</Text>
      <View style={styles.chipWrap}>
        {TRIGGER_OPTIONS.map((trigger) => {
          const isSelected = selectedTriggers.includes(trigger);
          return (
            <Pressable
              key={trigger}
              style={({ pressed }) => [
                styles.chip,
                isSelected && styles.chipSelected,
                pressed && styles.pressed,
              ]}
              onPress={() => toggleTrigger(trigger)}>
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {trigger}
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
  severityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  severityDot: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  severityDotSelected: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  severityText: { fontSize: 18, color: palette.textPrimary },
  severityTextSelected: { color: '#fff', fontWeight: '700' },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: palette.textPrimary,
    marginTop: 32,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
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
  pressed: { transform: [{ scale: 0.96 }] },
  chipText: { color: palette.textPrimary, fontSize: 14 },
  chipTextSelected: { color: '#fff', fontWeight: '600' },
});
