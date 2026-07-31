import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';

import { palette } from '@/constants/Colors';
import { useAppStore } from '@/stores/appStore';

export default function SignupScreen() {
  const router = useRouter();
  const setAuthenticated = useAppStore((state) => state.setAuthenticated);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [anonymousHandle, setAnonymousHandle] = useState('');

  // Placeholder signup: replace with a real account-creation call.
  const handleCreateAccount = () => {
    setAuthenticated(true);
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>
            Your real name stays private. In the community you will only ever
            appear under your anonymous handle.
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={palette.textSecondary}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Username (private)"
            placeholderTextColor={palette.textSecondary}
            autoCapitalize="none"
            value={username}
            onChangeText={setUsername}
          />
          <TextInput
            style={styles.input}
            placeholder="Anonymous handle (shown in community)"
            placeholderTextColor={palette.textSecondary}
            autoCapitalize="none"
            value={anonymousHandle}
            onChangeText={setAnonymousHandle}
          />

          <Pressable style={styles.primaryButton} onPress={handleCreateAccount}>
            <Text style={styles.primaryButtonText}>Create account</Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <Link href="/(auth)/login" style={styles.footerLink}>
            Sign in
          </Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.surface },
  container: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  header: { marginBottom: 28 },
  title: { fontSize: 26, fontWeight: '700', color: palette.textPrimary },
  subtitle: {
    fontSize: 15,
    color: palette.textSecondary,
    marginTop: 8,
    lineHeight: 21,
  },
  form: { gap: 12 },
  input: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: palette.textPrimary,
    backgroundColor: palette.surfaceMuted,
  },
  primaryButton: {
    backgroundColor: palette.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 32,
  },
  footerText: { color: palette.textSecondary, fontSize: 15 },
  footerLink: { color: palette.primary, fontSize: 15, fontWeight: '600' },
});
