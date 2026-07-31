import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { palette } from '@/constants/Colors';

export default function DashboardScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>Good to see you 👋</Text>
      <Text style={styles.subtitle}>One day at a time. Here's where you stand.</Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Current streak</Text>
        <Text style={styles.streakValue}>12 days</Text>
        <Text style={styles.cardHint}>Placeholder data — wire up real tracking later.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Today</Text>
        <Pressable
          style={styles.primaryButton}
          onPress={() => router.push('/(modals)/daily-check-in')}>
          <Text style={styles.primaryButtonText}>Start daily check-in</Text>
        </Pressable>
        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.push('/(modals)/crisis-resources')}>
          <Text style={styles.secondaryButtonText}>Crisis resources</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Quick tip</Text>
        <Text style={styles.cardBody}>
          Urges usually pass within 15–30 minutes. If one hits, try the Panic
          Mode button — it will walk you through a breathing exercise.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.surfaceMuted },
  content: { padding: 20, paddingBottom: 120 },
  greeting: { fontSize: 26, fontWeight: '700', color: palette.textPrimary },
  subtitle: { fontSize: 15, color: palette.textSecondary, marginTop: 6 },
  card: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 18,
    marginTop: 16,
    borderWidth: 1,
    borderColor: palette.border,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  streakValue: {
    fontSize: 36,
    fontWeight: '800',
    color: palette.primary,
    marginTop: 6,
  },
  cardHint: { fontSize: 13, color: palette.textSecondary, marginTop: 4 },
  cardBody: { fontSize: 15, color: palette.textPrimary, marginTop: 8, lineHeight: 22 },
  primaryButton: {
    backgroundColor: palette.primary,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 12,
  },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  secondaryButton: {
    borderWidth: 1,
    borderColor: palette.primary,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 10,
  },
  secondaryButtonText: { color: palette.primary, fontSize: 15, fontWeight: '600' },
});
