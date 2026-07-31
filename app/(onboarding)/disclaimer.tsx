import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { palette } from '@/constants/Colors';
import { useAppStore } from '@/stores/appStore';

export default function DisclaimerScreen() {
  const router = useRouter();
  const setOnboardingComplete = useAppStore((state) => state.setOnboardingComplete);

  const handleAgree = () => {
    setOnboardingComplete(true);
    router.replace('/(tabs)/dashboard');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Before we start</Text>
        <Text style={styles.body}>
          Recovery Companion is a self-help support tool. It is{' '}
          <Text style={styles.bold}>not medical care</Text>, and it is not a
          substitute for treatment from a doctor, therapist, or addiction
          specialist.
        </Text>
        <Text style={styles.body}>
          • The AI Coach offers general encouragement and coping ideas, not
          clinical advice or diagnoses.{'\n'}
          • If you are in danger or thinking about harming yourself, use Panic
          Mode or the crisis resources — or call your local emergency number
          immediately.{'\n'}
          • Community posts come from other members, not professionals.
        </Text>
        <Text style={styles.body}>
          By continuing you confirm you understand this and agree to use the
          app as a companion to — not a replacement for — professional help.
        </Text>
      </ScrollView>

      <Pressable style={styles.primaryButton} onPress={handleAgree}>
        <Text style={styles.primaryButtonText}>I Understand &amp; Agree</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.surface,
    paddingHorizontal: 24,
  },
  scrollContent: { paddingTop: 32, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: palette.textPrimary },
  body: {
    fontSize: 15,
    color: palette.textSecondary,
    marginTop: 16,
    lineHeight: 23,
  },
  bold: { fontWeight: '700', color: palette.textPrimary },
  primaryButton: {
    backgroundColor: palette.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 32,
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
