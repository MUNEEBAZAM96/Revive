import {
  asPurchasesError,
  isUnavailableError,
  packageForPlan,
  planIdForPackage,
  PURCHASES_ERROR_CODE,
  type PlanId,
  type PurchasesOffering,
  type PurchasesPackage,
} from '@/services/purchases';

/**
 * The Revive Pro purchase model, one level above the RevenueCat SDK.
 *
 *   entitlement "Revive Pro" ← offering packages "monthly" / "yearly" / "lifetime"
 *
 * Prices, trial lengths and billing copy all come from the store via
 * `plansFromOffering()` — nothing here is hardcoded for display. FALLBACK_PLANS
 * exists only so the paywall can render something in the moment before
 * offerings load, or if the network is down; it is never used to decide what a
 * customer is charged, because a plan without a `pkg` can't be purchased.
 */

export type { PlanId };

export interface PricingPlan {
  id: PlanId;
  priceLabel: string;
  /** Price in the store's local currency, used only for the savings calculation. */
  priceValue: number;
  periodLabel: string;
  billingNote: string;
  badge?: 'Best Value' | 'Most Popular';
  trialDays: number;
  /** The RevenueCat package to purchase. Absent on fallback plans. */
  pkg?: PurchasesPackage;
}

/** The order plans are shown in on the paywall. */
export const PLAN_ORDER: PlanId[] = ['monthly', 'yearly', 'lifetime'];

const PERIOD_LABEL: Record<PlanId, string> = {
  monthly: '/month',
  yearly: '/year',
  lifetime: 'one-time',
};

const BILLING_NOTE: Record<PlanId, string> = {
  monthly: 'Billed monthly · cancel anytime',
  yearly: 'Billed yearly · cancel anytime',
  lifetime: 'Pay once · yours forever',
};

/**
 * Placeholder pricing shown only while the real offering loads. Deliberately
 * has no `pkg`, so the CTA stays disabled until real store prices arrive —
 * nobody is ever charged a price they didn't see.
 */
export const FALLBACK_PLANS: PricingPlan[] = [
  {
    id: 'monthly',
    priceLabel: '—',
    priceValue: 0,
    periodLabel: PERIOD_LABEL.monthly,
    billingNote: BILLING_NOTE.monthly,
    trialDays: 0,
  },
  {
    id: 'yearly',
    priceLabel: '—',
    priceValue: 0,
    periodLabel: PERIOD_LABEL.yearly,
    billingNote: BILLING_NOTE.yearly,
    badge: 'Best Value',
    trialDays: 0,
  },
  {
    id: 'lifetime',
    priceLabel: '—',
    priceValue: 0,
    periodLabel: PERIOD_LABEL.lifetime,
    billingNote: BILLING_NOTE.lifetime,
    trialDays: 0,
  },
];

/** Converts an intro offer's period into whole days, for "N-day free trial" copy. */
function introTrialDays(pkg: PurchasesPackage): number {
  const intro = pkg.product.introPrice;
  // Only a zero-price intro offer is a free trial; a discounted intro price
  // isn't one and must not be advertised as one.
  if (!intro || intro.price > 0) return 0;

  const units = intro.periodNumberOfUnits * Math.max(intro.cycles, 1);
  switch (intro.periodUnit?.toUpperCase()) {
    case 'DAY':
      return units;
    case 'WEEK':
      return units * 7;
    case 'MONTH':
      return units * 30;
    case 'YEAR':
      return units * 365;
    default:
      return 0;
  }
}

/** Builds the paywall's plan list from a live offering, current store prices and all. */
export function plansFromOffering(offering: PurchasesOffering): PricingPlan[] {
  const plans: PricingPlan[] = [];

  for (const id of PLAN_ORDER) {
    const pkg = packageForPlan(offering, id);
    if (!pkg) continue;
    plans.push({
      id,
      priceLabel: pkg.product.priceString,
      priceValue: pkg.product.price,
      periodLabel: PERIOD_LABEL[id],
      billingNote: BILLING_NOTE[id],
      badge: id === 'yearly' ? 'Best Value' : undefined,
      trialDays: introTrialDays(pkg),
      pkg,
    });
  }

  // Any package we can't map (a weekly promo, a custom identifier) is still
  // purchasable through the RevenueCat paywall — it just isn't shown on the
  // in-app fallback paywall, which only knows these three plans.
  if (__DEV__) {
    const unmapped = offering.availablePackages.filter((pkg) => planIdForPackage(pkg) === null);
    if (unmapped.length) {
      console.warn(
        `[RevenueCat] Unmapped packages in offering "${offering.identifier}": ` +
          unmapped.map((p) => p.identifier).join(', '),
      );
    }
  }

  return plans;
}

/**
 * Works out which plan an active entitlement came from. The entitlement only
 * carries the store product identifier, so we match on the product ids
 * configured in RevenueCat (`monthly`, `yearly`, `lifetime`) plus the usual
 * store-side suffixes (`revive_pro_yearly`, `...:monthly-autorenewing`).
 * Returns null rather than guessing — callers treat that as "Pro, plan unknown".
 */
export function planIdFromEntitlement(entitlement: {
  productIdentifier: string;
  productPlanIdentifier?: string | null;
  expirationDate: string | null;
}): PlanId | null {
  const haystack =
    `${entitlement.productIdentifier} ${entitlement.productPlanIdentifier ?? ''}`.toLowerCase();

  if (haystack.includes('lifetime')) return 'lifetime';
  if (haystack.includes('year') || haystack.includes('annual')) return 'yearly';
  if (haystack.includes('month')) return 'monthly';
  // Non-expiring access with an unrecognizable product id is still lifetime.
  return entitlement.expirationDate === null ? 'lifetime' : null;
}

export function planById(plans: PricingPlan[], id: PlanId | null): PricingPlan | null {
  if (!id) return null;
  return plans.find((p) => p.id === id) ?? null;
}

/**
 * Percentage saved by choosing yearly over 12 months of the monthly plan.
 * Returns null when either plan is missing or prices aren't loaded, so the UI
 * omits the badge rather than printing a nonsense number.
 */
export function yearlySavingsPercent(plans: PricingPlan[]): number | null {
  const monthly = planById(plans, 'monthly');
  const yearly = planById(plans, 'yearly');
  if (!monthly || !yearly || monthly.priceValue <= 0 || yearly.priceValue <= 0) return null;
  const percent = Math.round((1 - yearly.priceValue / (monthly.priceValue * 12)) * 100);
  return percent > 0 ? percent : null;
}

/* -------------------------------------------------------------------------- */
/*  Errors                                                                     */
/* -------------------------------------------------------------------------- */

export type SubscriptionErrorCode =
  | 'no_internet'
  | 'purchase_cancelled'
  | 'purchase_failed'
  | 'store_problem'
  | 'purchase_not_allowed'
  | 'payment_pending'
  | 'product_unavailable'
  | 'already_subscribed'
  | 'nothing_to_restore'
  | 'purchases_unavailable';

export const SUBSCRIPTION_ERROR_MESSAGES: Record<SubscriptionErrorCode, string> = {
  no_internet: "You're offline. Connect to the internet and try again.",
  purchase_cancelled: 'Purchase cancelled.',
  purchase_failed: "That didn't go through. Please try again.",
  store_problem: 'The store had a problem completing this. Please try again shortly.',
  purchase_not_allowed: 'Purchases are not allowed on this device. Check your device restrictions.',
  payment_pending: 'Your payment is pending approval. Revive Pro unlocks as soon as it clears.',
  product_unavailable: 'That plan is not available right now. Please try another or check back soon.',
  already_subscribed: "You're already subscribed to Revive Pro.",
  nothing_to_restore: 'No previous purchases were found for this account.',
  purchases_unavailable:
    'Purchases are unavailable in this build. Use a development build to subscribe.',
};

export class SubscriptionError extends Error {
  code: SubscriptionErrorCode;
  constructor(code: SubscriptionErrorCode, message?: string) {
    super(message ?? SUBSCRIPTION_ERROR_MESSAGES[code]);
    this.code = code;
    this.name = 'SubscriptionError';
  }
}

/**
 * Maps a RevenueCat error onto the small set of outcomes the UI distinguishes.
 * Anything unmapped becomes `purchase_failed` — a retryable, non-alarming
 * message — with the original logged so it's still debuggable.
 */
export function toSubscriptionError(error: unknown): SubscriptionError {
  if (error instanceof SubscriptionError) return error;
  if (isUnavailableError(error)) return new SubscriptionError('purchases_unavailable');

  const rc = asPurchasesError(error);
  if (!rc) {
    console.error('[Subscription] Unrecognized purchase error', error);
    return new SubscriptionError('purchase_failed');
  }

  switch (rc.code) {
    case PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR:
      return new SubscriptionError('purchase_cancelled');
    case PURCHASES_ERROR_CODE.NETWORK_ERROR:
    case PURCHASES_ERROR_CODE.OFFLINE_CONNECTION_ERROR:
      return new SubscriptionError('no_internet');
    case PURCHASES_ERROR_CODE.STORE_PROBLEM_ERROR:
    case PURCHASES_ERROR_CODE.TEST_STORE_SIMULATED_PURCHASE_ERROR:
      return new SubscriptionError('store_problem');
    case PURCHASES_ERROR_CODE.PURCHASE_NOT_ALLOWED_ERROR:
    case PURCHASES_ERROR_CODE.PURCHASE_INVALID_ERROR:
      return new SubscriptionError('purchase_not_allowed');
    case PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR:
      return new SubscriptionError('payment_pending');
    case PURCHASES_ERROR_CODE.PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR:
    case PURCHASES_ERROR_CODE.CONFIGURATION_ERROR:
      return new SubscriptionError('product_unavailable');
    case PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR:
    case PURCHASES_ERROR_CODE.RECEIPT_ALREADY_IN_USE_ERROR:
      return new SubscriptionError('already_subscribed');
    default:
      console.error(`[Subscription] Unhandled RevenueCat error ${rc.code}: ${rc.message}`);
      return new SubscriptionError('purchase_failed');
  }
}

/** Cancellation is a normal user action, not a failure — never surface it as an error banner. */
export function isCancellation(error: unknown): boolean {
  return toSubscriptionError(error).code === 'purchase_cancelled';
}
