import { useAuth } from '@clerk/expo';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAppStore } from '@/stores/appStore';

/**
 * Switchboard controller. Never renders UI — it only routes the user to the
 * correct area of the app based on Clerk auth + local onboarding state.
 *
 * Auth is now fully managed by Clerk:
 *   - `isLoaded` waits for the SDK to restore a cached session
 *   - `isSignedIn` replaces the old Zustand `isAuthenticated` flag
 *
 * All state changes elsewhere in the app can simply `router.replace('/')` to
 * re-run this logic.
 */
export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();
  const hasCompletedOnboarding = useAppStore((state) => state.hasCompletedOnboarding);

  // Clerk hasn't finished loading the cached session yet — show a subtle loader
  // so the switchboard doesn't flash the login screen before restoring a session.
  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3A8D6D" />
      </View>
    );
  }

  if (!isSignedIn) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!hasCompletedOnboarding) {
    return <Redirect href="/(onboarding)" />;
  }

  return <Redirect href="/(tabs)" />;
}
