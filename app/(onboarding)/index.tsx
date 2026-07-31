import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { palette } from '@/constants/Colors';
import { useAppStore } from '@/stores/appStore';

const MINIMUM_AGE = 18;

export default function AgeGateScreen() {
  const router = useRouter();
  const isUnderAge = useAppStore((state) => state.isUnderAge);
  const setIsUnderAge = useAppStore((state) => state.setIsUnderAge);
  const [birthYear, setBirthYear] = useState('');
  const [showError, setShowError] = useState(false);

  // Placeholder age assurance: a year-only check. Replace with a full DOB
  // picker + a proper age-assurance provider before launch.
  const handleContinue = () => {
    const year = Number.parseInt(birthYear, 10);
    const currentYear = new Date().getFullYear();

    if (!Number.isInteger(year) || year < 1900 || year > currentYear) {
      setShowError(true);
      return;
    }
    setShowError(false);

    if (currentYear - year < MINIMUM_AGE) {
      setIsUnderAge(true);
      return;
    }
    router.push('/(onboarding)/goals');
  };

  if (isUnderAge) {
    return (
      <View style={styles.container}>
        <Text style={styles.blockEmoji}>💙</Text>
        <Text style={styles.title}>We can't offer you this app yet</Text>
        <Text style={styles.body}>
          Recovery Companion is designed for adults 18 and over, so we can't
          let you continue. That doesn't mean you're on your own — free,
          confidential help for young people is available right now.
        </Text>
        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.push('/(modals)/crisis-resources')}>
          <Text style={styles.secondaryButtonText}>View free support resources</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>First, a quick age check</Text>
      <Text style={styles.body}>
        Recovery Companion is for adults 18 and over. Please enter your year of
        birth to continue.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Year of birth (e.g. 1995)"
        placeholderTextColor={palette.textSecondary}
        keyboardType="number-pad"
        maxLength={4}
        value={birthYear}
        onChangeText={setBirthYear}
      />
      {showError && (
        <Text style={styles.errorText}>Please enter a valid four-digit year.</Text>
      )}

      <Pressable style={styles.primaryButton} onPress={handleContinue}>
        <Text style={styles.primaryButtonText}>Continue</Text>
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
  blockEmoji: { fontSize: 48, textAlign: 'center', marginBottom: 16 },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: palette.textPrimary,
    textAlign: 'center',
  },
  body: {
    fontSize: 15,
    color: palette.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
  },
  input: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    color: palette.textPrimary,
    backgroundColor: palette.surfaceMuted,
    textAlign: 'center',
    marginTop: 28,
  },
  errorText: { color: palette.danger, marginTop: 8, textAlign: 'center' },
  primaryButton: {
    backgroundColor: palette.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondaryButton: {
    borderWidth: 1,
    borderColor: palette.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 28,
  },
  secondaryButtonText: { color: palette.primary, fontSize: 16, fontWeight: '600' },
});
