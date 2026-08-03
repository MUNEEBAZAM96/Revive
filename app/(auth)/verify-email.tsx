import { useSignUp } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
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
import ArrowLeft from 'lucide-react-native/icons/arrow-left';

import { useReviveColors } from '@/components/dashboard/theme';
import { SPACING } from '@/constants/spacing';

/**
 * Email verification screen — Clerk v3 (Core 3) API.
 *
 * The user enters the 6-digit code sent by Clerk after sign-up.
 * On success, signUp.finalize() sets the newly created session as active
 * and the switchboard (`/`) routes to onboarding or the dashboard.
 */
export default function VerifyEmailScreen() {
  const router = useRouter();
  const colors = useReviveColors();
  const { signUp, errors, fetchStatus } = useSignUp();
  const inputRef = useRef<TextInput>(null);

  const [code, setCode] = useState('');
  const [resending, setResending] = useState(false);

  const isBusy = fetchStatus === 'fetching';

  const handleVerify = async () => {
    if (code.length < 6) {
      Alert.alert('Incomplete code', 'Please enter the full 6-digit code from your email.');
      return;
    }

    try {
      const { error } = await signUp.verifications.verifyEmailCode({ code });

      if (error) {
        // Error surfaced via `errors` from the hook
        return;
      }

      if (signUp.status === 'complete') {
        await signUp.finalize({
          navigate: ({ session }) => {
            if (session?.currentTask) {
              console.log('Session task:', session.currentTask);
              return;
            }
            // Navigate to switchboard — it will route to onboarding or dashboard
            router.replace('/');
          },
        });
      } else {
        Alert.alert(
          'Verification incomplete',
          'There was an issue completing your sign-up. Please try again.',
        );
      }
    } catch (err) {
      console.error('Verification error:', err);
      Alert.alert('Verification failed', 'Something went wrong. Please try again.');
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const { error } = await signUp.verifications.sendEmailCode();
      if (error) {
        Alert.alert('Could not resend', error.message ?? 'Please try again in a moment.');
      } else {
        Alert.alert('Code sent', 'A new verification code has been sent to your email.');
        setCode('');
        inputRef.current?.focus();
      }
    } catch (err) {
      Alert.alert('Could not resend', 'Please try again in a moment.');
    } finally {
      setResending(false);
    }
  };

  // Extract friendly error from Clerk's errors object
  const codeError = errors?.fields?.code?.message;
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
          <View className="items-center" style={{ marginBottom: SPACING['3xl'] }}>
            <Text className="text-5xl">✉️</Text>
            <Text className="mt-3 text-[26px] font-bold text-revive-ink dark:text-revive-ink-dark">
              Check your email
            </Text>
            <Text className="mt-2 text-center text-[15px] leading-6 text-revive-muted dark:text-revive-muted-dark">
              We sent a 6-digit verification code to{'\n'}
              <Text className="font-semibold text-revive-ink dark:text-revive-ink-dark">
                {signUp?.emailAddress ?? 'your email'}
              </Text>
            </Text>
          </View>

          <View style={{ gap: SPACING.lg }}>
            {globalError && (
              <Text className="text-center text-[14px] text-[#D1567B]">{globalError}</Text>
            )}

            <View>
              <TextInput
                ref={inputRef}
                className={`rounded-2xl bg-revive-mist px-4 py-4 text-center text-[28px] font-bold text-revive-ink dark:bg-revive-mist-dark dark:text-revive-ink-dark ${
                  codeError ? 'border-2 border-[#D1567B]' : ''
                }`}
                style={{ letterSpacing: 12 }}
                placeholder="000000"
                placeholderTextColor={colors.secondary}
                value={code}
                onChangeText={(text) => setCode(text.replace(/[^0-9]/g, '').slice(0, 6))}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                autoComplete="one-time-code"
                autoFocus
                maxLength={6}
                textAlign="center"
                editable={!isBusy}
              />
              {codeError && (
                <Text className="mt-1 text-center text-[13px] text-[#D1567B]">{codeError}</Text>
              )}
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={isBusy || code.length < 6}
              onPress={handleVerify}
              className="items-center rounded-2xl bg-revive-primary py-4 active:scale-95 dark:bg-revive-primary-dark"
              style={{ opacity: isBusy || code.length < 6 ? 0.6 : 1 }}>
              <Text className="text-base font-bold text-white dark:text-revive-bg-dark">
                {isBusy ? 'Verifying…' : 'Verify & Continue'}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              disabled={resending || isBusy}
              onPress={handleResend}
              className="items-center py-2 active:opacity-70">
              <Text className="text-[14px] font-medium text-revive-primary dark:text-revive-primary-dark">
                {resending ? 'Resending…' : "Didn't receive the code? Resend"}
              </Text>
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            className="mt-6 flex-row items-center justify-center gap-1.5 py-2 active:opacity-70">
            <ArrowLeft size={14} color={colors.muted} />
            <Text className="text-[14px] text-revive-muted dark:text-revive-muted-dark">
              Go back
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
