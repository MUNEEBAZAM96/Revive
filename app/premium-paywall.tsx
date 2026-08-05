import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import PremiumPaywall from '@/components/coach/PremiumPaywall';
import { useSubscription } from '@/hooks/useSubscription';

/**
 * The Revive Pro paywall route.
 *
 * Preference order:
 *   1. The RevenueCat paywall for the current offering — remotely configured,
 *      so pricing, copy and A/B tests change without an app release.
 *   2. The in-app paywall (components/coach/PremiumPaywall), used when no
 *      RevenueCat paywall is configured for the offering, or when RevenueCat
 *      can't run at all (Expo Go, web, offline first launch).
 *
 * The SDK doesn't expose "does this offering have a paywall?" ahead of time,
 * so we ask it to present and treat NOT_PRESENTED/ERROR as the signal to fall
 * back — which also covers a paywall that fails to load for any other reason.
 */
export default function PremiumPaywallRoute() {
  const router = useRouter();
  const { openPaywall, isLoading, unavailable, offering } = useSubscription();
  const [mode, setMode] = useState<'deciding' | 'fallback'>('deciding');
  const presented = useRef(false);

  const dismiss = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }, [router]);

  useEffect(() => {
    // Wait for the first offerings fetch before deciding — presenting too early
    // would report NOT_PRESENTED and drop us to the fallback unnecessarily.
    if (isLoading) return;

    if (unavailable || !offering) {
      setMode('fallback');
      return;
    }

    // StrictMode/re-renders must not stack two native paywalls.
    if (presented.current) return;
    presented.current = true;

    let cancelled = false;
    (async () => {
      const outcome = await openPaywall();
      if (cancelled) return;

      switch (outcome) {
        case 'purchased':
        case 'restored':
        case 'cancelled':
          // `isPro` is already updated by the time the paywall closes, so
          // returning to the Coach shows the unlocked state immediately.
          dismiss();
          break;
        default:
          // No paywall configured for this offering, or it failed to load.
          setMode('fallback');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoading, unavailable, offering, openPaywall, dismiss]);

  if (mode === 'fallback') {
    return <PremiumPaywall onDismiss={dismiss} />;
  }

  // Brief — the native paywall animates in over this.
  return (
    <View className="flex-1 items-center justify-center bg-revive-bg dark:bg-revive-bg-dark">
      <ActivityIndicator />
    </View>
  );
}
