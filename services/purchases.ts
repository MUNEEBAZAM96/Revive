import Constants from 'expo-constants';
import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  PACKAGE_TYPE,
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesEntitlementInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from 'react-native-purchases';

/**
 * The single place that talks to RevenueCat. Everything above it
 * (subscriptionService → subscriptionStore → useSubscription) works with
 * plain app-level types, so no screen ever imports `react-native-purchases`
 * directly.
 *
 * Two things this module is defensive about, both of which would otherwise
 * crash the app rather than degrade it:
 *
 *   1. The native module is missing in Expo Go and on web. Purchases needs a
 *      dev build (`expo run:ios` / `expo run:android`). When it's absent we
 *      report `unavailable` and the app runs as free-tier.
 *   2. `configure()` must happen exactly once per process, before any other
 *      Purchases call. `ensureConfigured()` is idempotent and awaited by
 *      every entry point below.
 */

/** The entitlement that unlocks the AI Coach. Must match the identifier in the RevenueCat dashboard exactly. */
export const PRO_ENTITLEMENT_ID = process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT ?? 'Revive Pro';

/** The offering that backs the paywall. `null` means "whatever the dashboard marks as current". */
export const DEFAULT_OFFERING_ID = process.env.EXPO_PUBLIC_REVENUECAT_OFFERING ?? null;

/**
 * A `test_` key is a RevenueCat Test Store key: it works on both platforms
 * without App Store / Play products, which is what makes local development
 * possible. RevenueCat is explicit that it must never ship —
 * production builds need the platform keys below.
 */
const TEST_STORE_API_KEY = 'test_blwaLOwpNYjvYBclDbifgXGwwsw';

const IOS_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
const ANDROID_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;

function apiKeyForPlatform(): string | null {
  const platformKey = Platform.OS === 'ios' ? IOS_API_KEY : ANDROID_API_KEY;
  if (platformKey) return platformKey;
  // No platform key configured yet — fall back to the Test Store key so the
  // purchase flow is exercisable, but only in development.
  return __DEV__ ? TEST_STORE_API_KEY : null;
}

/** Expo Go ships no third-party native modules, so Purchases can't run there. */
const isExpoGo = Constants.executionEnvironment === 'storeClient';

/** react-native-purchases-ui (paywalls, Customer Center) is native-only. */
export const isPurchasesSupported = Platform.OS !== 'web' && !isExpoGo;

export type PurchasesUnavailableReason = 'expo_go' | 'web' | 'missing_api_key' | 'configure_failed';

let configurePromise: Promise<void> | null = null;
let configured = false;
let unavailableReason: PurchasesUnavailableReason | null = null;

export function purchasesUnavailableReason(): PurchasesUnavailableReason | null {
  return unavailableReason;
}

/** True once `configure()` has succeeded — callers must not hit the SDK before this. */
export function isConfigured(): boolean {
  return configured;
}

class PurchasesUnavailableError extends Error {
  reason: PurchasesUnavailableReason;
  constructor(reason: PurchasesUnavailableReason) {
    super(`RevenueCat unavailable: ${reason}`);
    this.reason = reason;
    this.name = 'PurchasesUnavailableError';
  }
}

/**
 * Configures the SDK once per app process. Safe to call from anywhere and as
 * often as you like — later calls await the first one's result.
 *
 * @param appUserID the Clerk user id, or null to let RevenueCat generate an
 *   anonymous id that we later alias via `identifyUser()` on sign-in.
 */
export function ensureConfigured(appUserID?: string | null): Promise<void> {
  if (configurePromise) return configurePromise;

  configurePromise = (async () => {
    if (!isPurchasesSupported) {
      unavailableReason = isExpoGo ? 'expo_go' : 'web';
      if (__DEV__) {
        console.warn(
          `[RevenueCat] Skipping configure — ${unavailableReason}. ` +
            'Purchases require a development build (npx expo run:ios / run:android).',
        );
      }
      throw new PurchasesUnavailableError(unavailableReason);
    }

    const apiKey = apiKeyForPlatform();
    if (!apiKey) {
      unavailableReason = 'missing_api_key';
      console.error(
        '[RevenueCat] No API key for this platform. Set ' +
          'EXPO_PUBLIC_REVENUECAT_IOS_API_KEY / EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY.',
      );
      throw new PurchasesUnavailableError('missing_api_key');
    }

    if (!__DEV__ && apiKey.startsWith('test_')) {
      // A Test Store key in a release build grants entitlements no store ever
      // charged for. Fail loudly here rather than silently shipping it.
      unavailableReason = 'missing_api_key';
      console.error('[RevenueCat] Refusing to configure a release build with a Test Store key.');
      throw new PurchasesUnavailableError('missing_api_key');
    }

    try {
      // Verbose logs make store/product misconfiguration obvious; RevenueCat
      // recommends leaving them on while integrating.
      await Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR);

      Purchases.configure({
        apiKey,
        // `undefined` (not null) lets the SDK pick its own anonymous id.
        appUserID: appUserID ?? undefined,
      });

      configured = true;
      unavailableReason = null;
    } catch (error) {
      unavailableReason = 'configure_failed';
      console.error('[RevenueCat] configure() failed', error);
      throw new PurchasesUnavailableError('configure_failed');
    }
  })();

  // A failed configure shouldn't poison every later call with an unhandled
  // rejection; callers check `isConfigured()` / catch explicitly.
  configurePromise.catch(() => {});
  return configurePromise;
}

/* -------------------------------------------------------------------------- */
/*  Identity                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Links purchases to the signed-in Clerk user so entitlements follow them
 * across devices and reinstalls. Idempotent — RevenueCat no-ops when the id
 * already matches.
 */
export async function identifyUser(appUserID: string): Promise<CustomerInfo | null> {
  if (!(await configuredOrNull())) return null;
  try {
    const current = await Purchases.getAppUserID();
    if (current === appUserID) return Purchases.getCustomerInfo();
    const { customerInfo } = await Purchases.logIn(appUserID);
    return customerInfo;
  } catch (error) {
    console.error('[RevenueCat] logIn failed', error);
    return null;
  }
}

/** Returns the SDK to an anonymous id. Call on sign-out so the next user starts clean. */
export async function forgetUser(): Promise<CustomerInfo | null> {
  if (!(await configuredOrNull())) return null;
  try {
    return await Purchases.logOut();
  } catch (error) {
    // logOut throws when already anonymous — harmless.
    if (__DEV__) console.warn('[RevenueCat] logOut skipped', error);
    return null;
  }
}

async function configuredOrNull(): Promise<boolean> {
  try {
    await ensureConfigured();
    return configured;
  } catch {
    return false;
  }
}

/* -------------------------------------------------------------------------- */
/*  Entitlements                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Finds the Revive Pro entitlement in a CustomerInfo.
 *
 * Entitlement identifiers are case- and separator-sensitive in the RevenueCat
 * API, and "Revive Pro" is a display-name-shaped identifier that's easy to get
 * subtly wrong in the dashboard ("revive_pro", "pro"). We look for an exact
 * match first, then fall back to a normalized comparison and warn in dev, so a
 * mismatch shows up as a log line instead of a silently locked-out subscriber.
 */
export function findProEntitlement(customerInfo: CustomerInfo): PurchasesEntitlementInfo | null {
  const active = customerInfo.entitlements.active;

  const exact = active[PRO_ENTITLEMENT_ID];
  if (exact) return exact;

  const normalize = (s: string) => s.toLowerCase().replace(/[\s_-]/g, '');
  const target = normalize(PRO_ENTITLEMENT_ID);
  for (const [id, info] of Object.entries(active)) {
    if (normalize(id) === target) {
      if (__DEV__) {
        console.warn(
          `[RevenueCat] Entitlement "${id}" matched "${PRO_ENTITLEMENT_ID}" only after normalization. ` +
            'Set EXPO_PUBLIC_REVENUECAT_ENTITLEMENT to the exact dashboard identifier.',
        );
      }
      return info;
    }
  }

  return null;
}

/** Convenience check — true when Revive Pro is currently unlocked. */
export function hasProAccess(customerInfo: CustomerInfo): boolean {
  return findProEntitlement(customerInfo) !== null;
}

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!(await configuredOrNull())) return null;
  return Purchases.getCustomerInfo();
}

/**
 * Subscribes to entitlement changes. RevenueCat fires this on purchase,
 * renewal, expiry, restore and cross-device sync — it's what keeps `isPro`
 * correct without polling. Returns an unsubscribe function.
 */
export function onCustomerInfoUpdate(listener: (info: CustomerInfo) => void): () => void {
  if (!isPurchasesSupported) return () => {};
  Purchases.addCustomerInfoUpdateListener(listener);
  return () => {
    Purchases.removeCustomerInfoUpdateListener(listener);
  };
}

/* -------------------------------------------------------------------------- */
/*  Offerings & purchases                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Fetches the offering that backs the paywall — the one named by
 * EXPO_PUBLIC_REVENUECAT_OFFERING, or whichever the dashboard marks current.
 * Returns null when offerings aren't reachable or none are configured.
 */
export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  if (!(await configuredOrNull())) return null;

  const offerings = await Purchases.getOfferings();
  const offering = DEFAULT_OFFERING_ID
    ? (offerings.all[DEFAULT_OFFERING_ID] ?? offerings.current)
    : offerings.current;

  if (!offering && __DEV__) {
    console.warn(
      '[RevenueCat] No offering returned. Check that products are attached to an ' +
        'offering and that the offering is marked "current" in the dashboard.',
    );
  }
  return offering ?? null;
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo> {
  await ensureConfigured();
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

export async function restorePurchases(): Promise<CustomerInfo> {
  await ensureConfigured();
  return Purchases.restorePurchases();
}

/* -------------------------------------------------------------------------- */
/*  Package ↔ plan mapping                                                     */
/* -------------------------------------------------------------------------- */

export type PlanId = 'monthly' | 'yearly' | 'lifetime';

/**
 * Maps a RevenueCat package onto one of Revive's three plans.
 *
 * `packageType` is the reliable signal — it's set when you use RevenueCat's
 * predefined package identifiers ($rc_monthly / $rc_annual / $rc_lifetime).
 * Custom package identifiers come through as CUSTOM, so we fall back to
 * matching the package identifier and then the store product id, which is how
 * the products are named here (`monthly`, `yearly`, `lifetime`).
 */
export function planIdForPackage(pkg: PurchasesPackage): PlanId | null {
  switch (pkg.packageType) {
    case PACKAGE_TYPE.MONTHLY:
      return 'monthly';
    case PACKAGE_TYPE.ANNUAL:
      return 'yearly';
    case PACKAGE_TYPE.LIFETIME:
      return 'lifetime';
    default:
      break;
  }

  const haystack = `${pkg.identifier} ${pkg.product.identifier}`.toLowerCase();
  if (haystack.includes('lifetime')) return 'lifetime';
  if (haystack.includes('year') || haystack.includes('annual')) return 'yearly';
  if (haystack.includes('month')) return 'monthly';
  return null;
}

/** Finds the package backing a given plan within an offering. */
export function packageForPlan(offering: PurchasesOffering, plan: PlanId): PurchasesPackage | null {
  const direct =
    plan === 'monthly' ? offering.monthly : plan === 'yearly' ? offering.annual : offering.lifetime;
  if (direct) return direct;
  return offering.availablePackages.find((pkg) => planIdForPackage(pkg) === plan) ?? null;
}

/* -------------------------------------------------------------------------- */
/*  Errors                                                                     */
/* -------------------------------------------------------------------------- */

export { PURCHASES_ERROR_CODE };
export type { CustomerInfo, PurchasesEntitlementInfo, PurchasesOffering, PurchasesPackage };

/** Narrows an unknown thrown value to RevenueCat's error shape. */
export function asPurchasesError(
  error: unknown,
): { code: PURCHASES_ERROR_CODE; message: string; userCancelled: boolean } | null {
  if (!error || typeof error !== 'object') return null;
  const candidate = error as { code?: unknown; message?: unknown; userCancelled?: unknown };
  if (typeof candidate.code !== 'string') return null;
  return {
    code: candidate.code as PURCHASES_ERROR_CODE,
    message: typeof candidate.message === 'string' ? candidate.message : 'Purchase failed',
    userCancelled: candidate.userCancelled === true,
  };
}

export function isUnavailableError(error: unknown): error is PurchasesUnavailableError {
  return error instanceof PurchasesUnavailableError;
}
