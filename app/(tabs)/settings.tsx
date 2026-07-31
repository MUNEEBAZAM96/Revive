import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { palette } from '@/constants/Colors';
import { useAppStore } from '@/stores/appStore';

export default function SettingsScreen() {
  const router = useRouter();
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const setAuthenticated = useAppStore((state) => state.setAuthenticated);
  const setOnboardingComplete = useAppStore((state) => state.setOnboardingComplete);
  const logout = useAppStore((state) => state.logout);

  const handleResetOnboarding = () => {
    setOnboardingComplete(false);
    router.replace('/');
  };

  const handleToggleAuth = () => {
    setAuthenticated(!isAuthenticated);
    router.replace('/');
  };

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Profile</Text>
        <Text style={styles.body}>
          Profile, notification, and privacy settings will live here.
        </Text>
        <Pressable style={styles.secondaryButton} onPress={handleLogout}>
          <Text style={styles.secondaryButtonText}>Log out</Text>
        </Pressable>
      </View>

      <View style={[styles.card, styles.debugCard]}>
        <Text style={styles.sectionTitle}>🛠 Debug (remove before release)</Text>
        <Text style={styles.body}>
          Shortcuts for testing navigation state transitions.
        </Text>

        <Pressable style={styles.debugButton} onPress={handleResetOnboarding}>
          <Text style={styles.debugButtonText}>Reset Onboarding</Text>
        </Pressable>
        <Pressable style={styles.debugButton} onPress={handleToggleAuth}>
          <Text style={styles.debugButtonText}>Toggle Auth</Text>
        </Pressable>
        <Pressable
          style={styles.debugButton}
          onPress={() => router.push('/(modals)/crisis-resources')}>
          <Text style={styles.debugButtonText}>Simulate Crisis Signal</Text>
        </Pressable>
        <Pressable
          style={styles.debugButton}
          onPress={() => router.push('/(modals)/daily-check-in')}>
          <Text style={styles.debugButtonText}>Open Daily Check-in</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.surfaceMuted },
  content: { padding: 20, paddingBottom: 120 },
  title: { fontSize: 24, fontWeight: '700', color: palette.textPrimary },
  card: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 18,
    marginTop: 16,
    borderWidth: 1,
    borderColor: palette.border,
  },
  debugCard: { borderColor: '#f0c36d', backgroundColor: '#fff9ec' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: palette.textPrimary },
  body: { fontSize: 14, color: palette.textSecondary, marginTop: 6, lineHeight: 20 },
  secondaryButton: {
    borderWidth: 1,
    borderColor: palette.danger,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  secondaryButtonText: { color: palette.danger, fontSize: 15, fontWeight: '600' },
  debugButton: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  debugButtonText: { color: palette.textPrimary, fontSize: 15, fontWeight: '500' },
});
