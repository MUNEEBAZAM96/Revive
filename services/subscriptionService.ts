import NetInfo from '@react-native-community/netinfo';

/**
 * The Revive Pro purchase flow. Currently a local mock — there is no
 * RevenueCat account/API keys configured yet, so nothing here talks to a
 * real store. Shaped to mirror RevenueCat's model on purpose:
 *
 *   entitlement "pro" ← offerings "monthly" / "yearly"
 *
 * Swapping in the real SDK later means: call `Purchases.configure()` once at
 * launch, replace `purchasePlan`/`restorePurchases`'s bodies with
 * `Purchases.purchasePackage`/`Purchases.restorePurchases`, and check
 * `customerInfo.entitlements.active.pro` instead of the local `isPro` flag.
 * Nothing in the store or the paywall UI needs to change shape.
 */

export type PlanId = 'monthly' | 'yearly';

export interface PricingPlan {
  id: PlanId;
  priceLabel: string;
  /** USD, used only for the savings calculation below. */
  priceValue: number;
  periodLabel: string;
  billingNote: string;
  badge?: 'Best Value' | 'Most Popular';
  trialDays: number;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'monthly',
    priceLabel: '$9.99',
    priceValue: 9.99,
    periodLabel: '/month',
    billingNote: 'Billed monthly · cancel anytime',
    trialDays: 3,
  },
  {
    id: 'yearly',
    priceLabel: '$59.99',
    priceValue: 59.99,
    periodLabel: '/year',
    billingNote: 'Billed yearly · cancel anytime',
    badge: 'Best Value',
    trialDays: 7,
  },
];

export function planById(id: PlanId): PricingPlan {
  const plan = PRICING_PLANS.find((p) => p.id === id);
  if (!plan) throw new Error(`Unknown plan: ${id}`);
  return plan;
}

/** Percentage saved by choosing yearly over 12 months of the monthly plan. */
export function yearlySavingsPercent(): number {
  const monthly = planById('monthly').priceValue;
  const yearly = planById('yearly').priceValue;
  return Math.round((1 - yearly / (monthly * 12)) * 100);
}

export type SubscriptionErrorCode =
  | 'no_internet'
  | 'purchase_cancelled'
  | 'purchase_failed'
  | 'store_unavailable'
  | 'already_subscribed'
  | 'nothing_to_restore';

export class SubscriptionError extends Error {
  code: SubscriptionErrorCode;
  constructor(code: SubscriptionErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'SubscriptionError';
  }
}

export const SUBSCRIPTION_ERROR_MESSAGES: Record<SubscriptionErrorCode, string> = {
  no_internet: "You're offline. Connect to the internet and try again.",
  purchase_cancelled: 'Purchase cancelled.',
  purchase_failed: "That didn't go through. Please try again.",
  store_unavailable: 'The App Store is unavailable right now. Please try again shortly.',
  already_subscribed: "You're already subscribed to Revive Pro.",
  nothing_to_restore: 'No previous purchases were found for this account.',
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function assertOnline(): Promise<void> {
  const state = await NetInfo.fetch();
  if (state.isConnected === false) {
    throw new SubscriptionError('no_internet', SUBSCRIPTION_ERROR_MESSAGES.no_internet);
  }
}

export async function purchasePlan(
  planId: PlanId,
  options?: { alreadyPro?: boolean },
): Promise<{ plan: PlanId; trialDays: number }> {
  await assertOnline();
  if (options?.alreadyPro) {
    throw new SubscriptionError('already_subscribed', SUBSCRIPTION_ERROR_MESSAGES.already_subscribed);
  }
  await delay(1300 + Math.random() * 400); // simulated store round-trip
  return { plan: planId, trialDays: planById(planId).trialDays };
}

export async function restorePurchases(hasPriorPurchase: boolean): Promise<{ plan: PlanId }> {
  await assertOnline();
  await delay(900 + Math.random() * 300);
  if (!hasPriorPurchase) {
    throw new SubscriptionError('nothing_to_restore', SUBSCRIPTION_ERROR_MESSAGES.nothing_to_restore);
  }
  return { plan: 'yearly' };
}
