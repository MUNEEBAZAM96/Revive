import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Alert, Platform, Pressable, Text, View } from 'react-native';

import { useReviveColors } from '@/components/dashboard/theme';

/**
 * Google sign-in entry point using Clerk's native Google authentication.
 *
 * Real Google Sign-In requires a native development build plus
 * `@clerk/expo-google-signin` configured — neither is set up yet, so this
 * currently just explains that clearly rather than attempting (and failing)
 * a real sign-in. Swap the body of `handleGoogleSignIn` for the real
 * `useSignInWithGoogle()` flow once that's configured; nothing else here
 * needs to change.
 */

interface GoogleSignInButtonProps {
  /** Whether to show the "or continue with" divider above. */
  showDivider?: boolean;
}

export default function GoogleSignInButton({ showDivider = true }: GoogleSignInButtonProps) {
  const colors = useReviveColors();

  // Only render on native platforms where Google Sign-In works.
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return null;
  }

  const handleGoogleSignIn = () => {
    Alert.alert(
      'Development Build Required',
      'Google Sign-In requires a native development build. Use email sign-in for now.',
    );
  };

  return (
    <>
      {showDivider && (
        <View className="my-2 flex-row items-center gap-3">
          <View className="h-px flex-1 bg-revive-mist dark:bg-revive-mist-dark" />
          <Text className="text-[13px] text-revive-muted dark:text-revive-muted-dark">
            or continue with
          </Text>
          <View className="h-px flex-1 bg-revive-mist dark:bg-revive-mist-dark" />
        </View>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sign in with Google"
        onPress={handleGoogleSignIn}
        className="flex-row items-center justify-center gap-2.5 rounded-2xl border border-revive-mist bg-revive-card py-3.5 active:opacity-80 dark:border-revive-mist-dark dark:bg-revive-card-dark">
        <FontAwesome name="google" size={17} color={colors.ink} />
        <Text className="text-[15px] font-medium text-revive-ink dark:text-revive-ink-dark">
          Continue with Google
        </Text>
      </Pressable>
    </>
  );
}
