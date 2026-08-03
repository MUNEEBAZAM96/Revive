import { useMemo } from 'react';

import { planById, type PlanId } from '@/services/subscriptionService';
import { useSubscriptionStore } from '@/stores/subscriptionStore';

/**
 * The single hook screens use to read Pro status and act on it. Reads
 * straight from the persisted store, so `isPro` flips reactively the instant
 * a purchase completes — no restart, no refetch, per the "immediately
 * unlock" requirement.
 */
export function useSubscription() {
  const isPro = useSubscriptionStore((s) => s.isPro);
  const plan = useSubscriptionStore((s) => s.plan);
  const trialEndsAt = useSubscriptionStore((s) => s.trialEndsAt);
  const renewsAt = useSubscriptionStore((s) => s.renewsAt);
  const status = useSubscriptionStore((s) => s.status);
  const lastError = useSubscriptionStore((s) => s.lastError);
  const purchase = useSubscriptionStore((s) => s.purchase);
  const restore = useSubscriptionStore((s) => s.restore);
  const clearError = useSubscriptionStore((s) => s.clearError);
  const debugDowngrade = useSubscriptionStore((s) => s.debugDowngrade);

  const planDetails = useMemo(() => (plan ? planById(plan as PlanId) : null), [plan]);
  const isTrialing = useMemo(
    () => Boolean(trialEndsAt && new Date(trialEndsAt).getTime() > Date.now()),
    [trialEndsAt],
  );

  return {
    isPro,
    plan,
    planDetails,
    trialEndsAt,
    isTrialing,
    renewsAt,
    status,
    isBusy: status !== 'idle',
    lastError,
    purchase,
    restore,
    clearError,
    debugDowngrade,
  };
}
