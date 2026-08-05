import {
  ensureConfigured,
  getCustomerInfo,
  isPurchasesSupported,
  PRO_ENTITLEMENT_ID,
  type CustomerInfo,
  type PurchasesOffering,
} from '@/services/purchases';

/**
 * RevenueCat's prebuilt native UI — Paywalls and the Customer Center.
 *
 * Both are remotely configured in the RevenueCat dashboard, which is the point:
 * pricing layout, copy, A/B tests and the cancel/refund flows change without an
 * app release. This module keeps three things out of the screens:
 *
 *   - `react-native-purchases-ui` is required lazily, because importing it on
 *     web or in Expo Go (no native module) throws at module scope and would
 *     take the whole bundle down.
 *   - the SDK is guaranteed configured before anything is presented.
 *   - every path that can change entitlements reports a fresh CustomerInfo
 *     back to the caller, so `isPro` updates without waiting for the listener.
 */

export type PaywallOutcome = 'purchased' | 'restored' | 'cancelled' | 'not_presented' | 'error';

type RevenueCatUIModule = typeof import('react-native-purchases-ui').default;

function loadUI(): RevenueCatUIModule | null {
  if (!isPurchasesSupported) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('react-native-purchases-ui').default as RevenueCatUIModule;
  } catch (error) {
    console.error('[RevenueCat] react-native-purchases-ui unavailable', error);
    return null;
  }
}

/** The PAYWALL_RESULT enum is string-valued, so we can map it without importing it. */
function toOutcome(result: string): PaywallOutcome {
  switch (result) {
    case 'PURCHASED':
      return 'purchased';
    case 'RESTORED':
      return 'restored';
    case 'CANCELLED':
      return 'cancelled';
    case 'NOT_PRESENTED':
      return 'not_presented';
    default:
      return 'error';
  }
}

interface PresentOptions {
  /** The offering to show. Omit to use whichever the dashboard marks current. */
  offering?: PurchasesOffering | null;
  /** Receives the CustomerInfo after any entitlement-changing action. */
  onCustomerInfo?: (info: CustomerInfo) => void;
}

/**
 * Reads entitlements back after the native UI closes. The paywall's own result
 * tells us *what* happened but not the resulting entitlement state, and the
 * Customer Center reports nothing at all for a cancellation — so a read here is
 * what keeps the app honest rather than optimistic.
 */
async function reportCustomerInfo(onCustomerInfo?: (info: CustomerInfo) => void): Promise<void> {
  if (!onCustomerInfo) return;
  try {
    const info = await getCustomerInfo();
    if (info) onCustomerInfo(info);
  } catch (error) {
    if (__DEV__) console.warn('[RevenueCat] post-UI CustomerInfo read failed', error);
  }
}

/** Presents the RevenueCat paywall for the given (or current) offering. */
export async function presentPaywall({
  offering,
  onCustomerInfo,
}: PresentOptions = {}): Promise<PaywallOutcome> {
  const ui = loadUI();
  if (!ui) return 'not_presented';

  try {
    await ensureConfigured();
  } catch {
    return 'not_presented';
  }

  try {
    const result = await ui.presentPaywall({
      offering: offering ?? undefined,
      displayCloseButton: true,
    });
    const outcome = toOutcome(result);
    if (outcome === 'purchased' || outcome === 'restored') {
      await reportCustomerInfo(onCustomerInfo);
    }
    return outcome;
  } catch (error) {
    console.error('[RevenueCat] presentPaywall failed', error);
    return 'error';
  }
}

/**
 * Presents the paywall only if Revive Pro isn't already active — the right call
 * for gating a feature, since it's a no-op for existing subscribers.
 */
export async function presentPaywallIfNeeded({
  offering,
  onCustomerInfo,
}: PresentOptions = {}): Promise<PaywallOutcome> {
  const ui = loadUI();
  if (!ui) return 'not_presented';

  try {
    await ensureConfigured();
  } catch {
    return 'not_presented';
  }

  try {
    const result = await ui.presentPaywallIfNeeded({
      requiredEntitlementIdentifier: PRO_ENTITLEMENT_ID,
      offering: offering ?? undefined,
      displayCloseButton: true,
    });
    const outcome = toOutcome(result);
    if (outcome === 'purchased' || outcome === 'restored') {
      await reportCustomerInfo(onCustomerInfo);
    }
    return outcome;
  } catch (error) {
    console.error('[RevenueCat] presentPaywallIfNeeded failed', error);
    return 'error';
  }
}

/** True when the Customer Center can actually be shown on this build. */
export function isCustomerCenterAvailable(): boolean {
  return loadUI() !== null;
}

interface CustomerCenterOptions {
  onCustomerInfo?: (info: CustomerInfo) => void;
  onDismiss?: () => void;
}

/**
 * Presents the Customer Center: manage or cancel a subscription, request a
 * refund (iOS), change plans, restore purchases, and answer the common support
 * questions — all configured in the RevenueCat dashboard.
 *
 * Note: RevenueCat has a known issue where this doesn't present from inside a
 * react-navigation modal screen. Settings is a regular (non-modal) page in
 * SwipePager, which is why it's called from there rather than from the paywall.
 */
export async function presentCustomerCenter({
  onCustomerInfo,
  onDismiss,
}: CustomerCenterOptions = {}): Promise<boolean> {
  const ui = loadUI();
  if (!ui) return false;

  try {
    await ensureConfigured();
  } catch {
    return false;
  }

  try {
    await ui.presentCustomerCenter({
      callbacks: {
        onRestoreCompleted: ({ customerInfo }) => onCustomerInfo?.(customerInfo),
        onRestoreFailed: ({ error }) => console.error('[RevenueCat] Customer Center restore failed', error),
        onPromotionalOfferSucceeded: ({ customerInfo }) => onCustomerInfo?.(customerInfo),
      },
    });

    // The promise resolves when the Customer Center closes. A cancellation or
    // refund made inside it isn't reported through any callback, so re-read.
    await reportCustomerInfo(onCustomerInfo);
    onDismiss?.();
    return true;
  } catch (error) {
    console.error('[RevenueCat] presentCustomerCenter failed', error);
    return false;
  }
}
