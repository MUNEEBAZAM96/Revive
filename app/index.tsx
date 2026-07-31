import { Redirect } from 'expo-router';

import { useAppStore } from '@/stores/appStore';

/**
 * Switchboard controller. Never renders UI — it only routes the user to the
 * correct area of the app based on global auth/onboarding state. All state
 * changes elsewhere in the app can simply `router.replace('/')` to re-run
 * this logic.
 */
export default function Index() {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const hasCompletedOnboarding = useAppStore((state) => state.hasCompletedOnboarding);

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!hasCompletedOnboarding) {
    return <Redirect href="/(onboarding)" />;
  }

  return <Redirect href="/(tabs)/dashboard" />;
}
