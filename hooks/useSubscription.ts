import { useCallback, useMemo } from 'react';

import {
  presentCustomerCenter,
  presentPaywall,
  presentPaywallIfNeeded,
} from '@/services/revenuecatUI';
import { planById } from '@/services/subscriptionService';
import { useSubscriptionStore } from '@/stores/subscriptionStore';

/**
 * The single hook screens use to read Pro status and act on it.
 *
 * `isPro` is a projection of RevenueCat's `customerInfo.entitlements.active`,
 * kept live by the CustomerInfo listener the store subscribes to — so it flips
 * the instant a purchase, restore, renewal or expiry lands, with no restart and
 * no refetch, however the change happened (custom paywall, RevenueCat paywall,
 * Customer Center, or another device).
 */
export function useSubscription() {
  const isPro = useSubscriptionStore((s) => s.isPro);
  const plan = useSubscriptionStore((s) => s.plan);
  const plans = useSubscriptionStore((s) => s.plans);
  const offering = useSubscriptionStore((s) => s.offering);
  const trialEndsAt = useSubscriptionStore((s) => s.trialEndsAt);
  const renewsAt = useSubscriptionStore((s) => s.renewsAt);
  const willRenew = useSubscriptionStore((s) => s.willRenew);
  const isLifetime = useSubscriptionStore((s) => s.isLifetime);
  const isLoading = useSubscriptionStore((s) => s.isLoading);
  const unavailable = useSubscriptionStore((s) => s.unavailable);
  const status = useSubscriptionStore((s) => s.status);
  const lastError = useSubscriptionStore((s) => s.lastError);
  const purchase = useSubscriptionStore((s) => s.purchase);
  const restore = useSubscriptionStore((s) => s.restore);
  const refresh = useSubscriptionStore((s) => s.refresh);
  const clearError = useSubscriptionStore((s) => s.clearError);
  const applyCustomerInfo = useSubscriptionStore((s) => s.applyCustomerInfo);

  const planDetails = useMemo(() => planById(plans, plan), [plans, plan]);
  const isTrialing = useMemo(
    () => Boolean(trialEndsAt && new Date(trialEndsAt).getTime() > Date.now()),
    [trialEndsAt],
  );

  /** Opens the RevenueCat-hosted paywall for the current offering. */
  const openPaywall = useCallback(
    () => presentPaywall({ offering, onCustomerInfo: applyCustomerInfo }),
    [offering, applyCustomerInfo],
  );

  /** Opens that paywall only if Revive Pro isn't already unlocked. */
  const openPaywallIfNeeded = useCallback(
    () => presentPaywallIfNeeded({ offering, onCustomerInfo: applyCustomerInfo }),
    [offering, applyCustomerInfo],
  );

  /** Opens RevenueCat's Customer Center — cancel, refund, plan changes, support. */
  const openCustomerCenter = useCallback(
    () => presentCustomerCenter({ onCustomerInfo: applyCustomerInfo, onDismiss: refresh }),
    [applyCustomerInfo, refresh],
  );

  return {
    isPro,
    plan,
    plans,
    planDetails,
    offering,
    trialEndsAt,
    isTrialing,
    renewsAt,
    willRenew,
    isLifetime,
    isLoading,
    /** True when RevenueCat can't run in this build (Expo Go, web, or no API key). */
    unavailable,
    status,
    isBusy: status !== 'idle',
    lastError,
    purchase,
    restore,
    refresh,
    clearError,
    openPaywall,
    openPaywallIfNeeded,
    openCustomerCenter,
  };
}
