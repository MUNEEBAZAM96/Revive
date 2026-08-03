import { useAuth, useSignUp } from '@clerk/expo';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Eye from 'lucide-react-native/icons/eye';
import EyeOff from 'lucide-react-native/icons/eye-off';

import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import { useReviveColors } from '@/components/dashboard/theme';
import { SPACING } from '@/constants/spacing';

/**
 * Sign-up screen using Clerk v3 (Core 3) API.
 *
 * Flow:
 * 1. signUp.password({ emailAddress, password })
 * 2. signUp.verifications.sendEmailCode()
 * 3. Navigate to verify-email screen
 */
export default function SignupScreen() {
  const router = useRouter();
  const colors = useReviveColors();
  const { isSignedIn } = useAuth();
  const { signUp, errors, fetchStatus } = useSignUp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const isBusy = fetchStatus === 'fetching';

  // If already signed in, redirect
  if (isSignedIn) {
    router.replace('/');
    return null;
  }

  const handleCreateAccount = async () => {
    if (!email.trim()) {
      Alert.alert('Missing email', 'Please enter your email address.');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Missing password', 'Please create a password for your account.');
      return;
    }

    try {
      // Step 1: Create sign-up with email + password
      const { error } = await signUp.password({
        emailAddress: email.trim(),
        password,
      });

      if (error) {
        // Error is surfaced via `errors` from the hook
        return;
      }

      // Step 2: Send email verification code
      const { error: sendError } = await signUp.verifications.sendEmailCode();
      if (sendError) {
        return;
      }

      // Step 3: Navigate to verify-email screen
      router.push('/(auth)/verify-email');
    } catch (err) {
      console.error('Sign-up error:', err);
      Alert.alert('Sign up failed', 'Something went wrong. Please try again.');
    }
  };

  // Extract friendly error messages from Clerk's errors object
  const emailError = errors?.fields?.emailAddress?.message;
  const passwordError = errors?.fields?.password?.message;
  const globalError = errors?.global?.[0]?.message;

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-revive-bg dark:bg-revive-bg-dark">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingHorizontal: SPACING.xl,
            paddingVertical: SPACING['3xl'],
          }}>
          <View className="items-center" style={{ marginBottom: SPACING['2xl'] }}>
            <Text className="text-5xl">🌿</Text>
            <Text className="mt-3 text-center text-[26px] font-bold text-revive-ink dark:text-revive-ink-dark">
              Start Your Recovery Journey
            </Text>
            <Text className="mt-2 text-center text-[15px] leading-5 text-revive-muted dark:text-revive-muted-dark">
              Create a private account to track your progress.{'\n'}Everything stays between you
              and Revive.
            </Text>
          </View>

          <View style={{ gap: SPACING.md }}>
            {globalError && (
              <Text className="text-center text-[14px] text-[#D1567B]">{globalError}</Text>
            )}

            <View>
              <TextInput
                className={`rounded-2xl bg-revive-mist px-4 py-3.5 text-[16px] text-revive-ink dark:bg-revive-mist-dark dark:text-revive-ink-dark ${
                  emailError ? 'border-2 border-[#D1567B]' : ''
                }`}
                placeholder="Email"
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                editable={!isBusy}
              />
              {emailError && (
                <Text className="ml-1 mt-1 text-[13px] text-[#D1567B]">{emailError}</Text>
              )}
            </View>

            <View>
              <View
                className={`flex-row items-center rounded-2xl bg-revive-mist dark:bg-revive-mist-dark ${
                  passwordError ? 'border-2 border-[#D1567B]' : ''
                }`}>
                <TextInput
                  className="flex-1 px-4 py-3.5 text-[16px] text-revive-ink dark:text-revive-ink-dark"
                  placeholder="Create a password"
                  placeholderTextColor={colors.muted}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  editable={!isBusy}
                />
                <Pressable
                  className="px-4 py-3.5 active:opacity-60"
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? (
                    <EyeOff size={18} color={colors.muted} />
                  ) : (
                    <Eye size={18} color={colors.muted} />
                  )}
                </Pressable>
              </View>
              {passwordError && (
                <Text className="ml-1 mt-1 text-[13px] text-[#D1567B]">{passwordError}</Text>
              )}
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={isBusy}
              onPress={handleCreateAccount}
              className="mt-1 items-center rounded-2xl bg-revive-primary py-4 active:scale-95 dark:bg-revive-primary-dark"
              style={{ opacity: isBusy ? 0.7 : 1 }}>
              <Text className="text-base font-bold text-white dark:text-revive-bg-dark">
                {isBusy ? 'Creating account…' : 'Continue'}
              </Text>
            </Pressable>

            {/* CAPTCHA target — Clerk uses this on web, no-ops on native */}
            <View nativeID="clerk-captcha" />

            <GoogleSignInButton showDivider />
          </View>

          <View className="mt-8 flex-row justify-center" style={{ gap: SPACING.xs }}>
            <Text className="text-[15px] text-revive-muted dark:text-revive-muted-dark">
              Already have an account?
            </Text>
            <Link href="/(auth)/login" className="text-[15px] font-semibold text-revive-primary dark:text-revive-primary-dark">
              Sign in
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
