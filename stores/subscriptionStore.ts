import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  ensureConfigured,
  findProEntitlement,
  forgetUser,
  getCurrentOffering,
  getCustomerInfo,
  identifyUser,
  isPurchasesSupported,
  onCustomerInfoUpdate,
  purchasePackage,
  purchasesUnavailableReason,
  restorePurchases,
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from '@/services/purchases';
import {
  FALLBACK_PLANS,
  planIdFromEntitlement,
  plansFromOffering,
  SubscriptionError,
  toSubscriptionError,
  type PlanId,
  type PricingPlan,
  type SubscriptionErrorCode,
} from '@/services/subscriptionService';

export type SubscriptionStatus = 'idle' | 'purchasing' | 'restoring';

export interface SubscriptionError_ {
  code: SubscriptionErrorCode;
  message: string;
}

interface SubscriptionState {
  /** Mirrors `customerInfo.entitlements.active["Revive Pro"]` — the single source of truth Coach access is gated on. */
  isPro: boolean;
  plan: PlanId | null;
  trialEndsAt: string | null;
  renewsAt: string | null;
  /** False once a subscription is cancelled but still within its paid period — lets Settings say "expires" instead of "renews". */
  willRenew: boolean;
  /** True for a lifetime purchase: entitlement is active with no expiry. */
  isLifetime: boolean;
  /** The store the entitlement came from, e.g. APP_STORE / PLAY_STORE / TEST_STORE. */
  store: string | null;
  /** RevenueCat's app user id — useful in support tickets. */
  appUserId: string | null;

  /** Plans for the paywall, from the live offering. Falls back to placeholder copy until loaded. */
  plans: PricingPlan[];
  offering: PurchasesOffering | null;
  /** True until the first entitlement read completes, so the UI can avoid flashing the free tier. */
  isLoading: boolean;
  /** Set when RevenueCat can't run at all here (Expo Go, web, no API key). */
  unavailable: boolean;

  status: SubscriptionStatus;
  lastError: SubscriptionError_ | null;

  initialize: (appUserId?: string | null) => Promise<void>;
  syncUser: (appUserId: string | null) => Promise<void>;
  refresh: () => Promise<void>;
  loadOfferings: () => Promise<void>;
  purchase: (planOrPackage: PlanId | PurchasesPackage) => Promise<boolean>;
  restore: () => Promise<boolean>;
  /** Applies a CustomerInfo produced elsewhere (RevenueCat paywall, Customer Center). */
  applyCustomerInfo: (info: CustomerInfo) => void;
  clearError: () => void;
}

function toStoreError(error: unknown): SubscriptionError_ {
  const mapped: SubscriptionError = toSubscriptionError(error);
  return { code: mapped.code, message: mapped.message };
}

/** Everything the app cares about, distilled out of a CustomerInfo. */
function snapshotFrom(info: CustomerInfo) {
  const entitlement = findProEntitlement(info);
  if (!entitlement) {
    return {
      isPro: false,
      plan: null,
      trialEndsAt: null,
      renewsAt: null,
      willRenew: false,
      isLifetime: false,
      store: null,
    };
  }

  const isTrial = entitlement.periodType === 'TRIAL';
  // A null expiration date on an active entitlement is RevenueCat's signal for
  // non-expiring access — i.e. the lifetime product.
  const isLifetime = entitlement.expirationDate === null;

  return {
    isPro: true,
    plan: planIdFromEntitlement(entitlement),
    trialEndsAt: isTrial ? entitlement.expirationDate : null,
    renewsAt: isTrial ? null : entitlement.expirationDate,
    willRenew: entitlement.willRenew,
    isLifetime,
    store: entitlement.store,
  };
}

let unsubscribeCustomerInfo: (() => void) | null = null;
let initializePromise: Promise<void> | null = null;

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      isPro: false,
      plan: null,
      trialEndsAt: null,
      renewsAt: null,
      willRenew: false,
      isLifetime: false,
      store: null,
      appUserId: null,

      plans: FALLBACK_PLANS,
      offering: null,
      isLoading: true,
      unavailable: !isPurchasesSupported,

      status: 'idle',
      lastError: null,

      applyCustomerInfo: (info) => set(snapshotFrom(info)),

      /**
       * Configures RevenueCat, reads the current entitlement, subscribes to
       * updates, and warms the offering cache. Called once from the root
       * layout; repeat calls return the first call's promise.
       */
      initialize: async (appUserId) => {
        if (initializePromise) return initializePromise;

        initializePromise = (async () => {
          try {
            await ensureConfigured(appUserId);
          } catch {
            set({ unavailable: true, isLoading: false });
            if (__DEV__) {
              console.warn(
                `[Subscription] Running without RevenueCat (${purchasesUnavailableReason()}). ` +
                  'The app behaves as free tier.',
              );
            }
            return;
          }

          set({ unavailable: false });

          // Push-style updates: RevenueCat fires this on purchase, renewal,
          // expiry, restore and cross-device sync, which is what keeps `isPro`
          // correct with no polling and no app restart.
          unsubscribeCustomerInfo?.();
          unsubscribeCustomerInfo = onCustomerInfoUpdate((info) => {
            set(snapshotFrom(info));
          });

          await Promise.all([get().refresh(), get().loadOfferings()]);
        })();

        return initializePromise;
      },

      /**
       * Keeps the RevenueCat identity in step with Clerk. Aliasing to the Clerk
       * user id is what lets entitlements follow someone to a new device.
       */
      syncUser: async (appUserId) => {
        if (get().unavailable) return;
        const info = appUserId ? await identifyUser(appUserId) : await forgetUser();
        set({ appUserId });
        if (info) set(snapshotFrom(info));
        // Offerings can be user-targeted (experiments, placements), so refetch
        // whenever the identity changes.
        await get().loadOfferings();
      },

      refresh: async () => {
        try {
          const info = await getCustomerInfo();
          if (info) set(snapshotFrom(info));
        } catch (error) {
          // A failed refresh is not worth an error banner: RevenueCat serves a
          // cached CustomerInfo offline, and the listener will correct us later.
          if (__DEV__) console.warn('[Subscription] refresh failed', error);
        } finally {
          set({ isLoading: false });
        }
      },

      loadOfferings: async () => {
        try {
          const offering = await getCurrentOffering();
          if (!offering) {
            set({ offering: null, plans: FALLBACK_PLANS });
            return;
          }
          set({ offering, plans: plansFromOffering(offering) });
        } catch (error) {
          if (__DEV__) console.warn('[Subscription] loadOfferings failed', error);
          set({ offering: null, plans: FALLBACK_PLANS });
        }
      },

      /**
       * Buys a plan. Accepts either a plan id (custom paywall) or a package
       * straight from RevenueCat. Entitlement state comes from the returned
       * CustomerInfo — never assumed from the fact the call resolved.
       */
      purchase: async (planOrPackage) => {
        const pkg =
          typeof planOrPackage === 'string'
            ? get().plans.find((p) => p.id === planOrPackage)?.pkg
            : planOrPackage;

        if (!pkg) {
          set({ lastError: toStoreError(new SubscriptionError('product_unavailable')) });
          return false;
        }

        set({ status: 'purchasing', lastError: null });
        try {
          const info = await purchasePackage(pkg);
          const snapshot = snapshotFrom(info);
          set({ ...snapshot, status: 'idle' });
          return snapshot.isPro;
        } catch (error) {
          const mapped = toStoreError(error);
          // Cancelling is a deliberate user action — clear the spinner, say nothing.
          set({ status: 'idle', lastError: mapped.code === 'purchase_cancelled' ? null : mapped });
          return false;
        }
      },

      restore: async () => {
        set({ status: 'restoring', lastError: null });
        try {
          const info = await restorePurchases();
          const snapshot = snapshotFrom(info);
          set({ ...snapshot, status: 'idle' });
          if (!snapshot.isPro) {
            // The call succeeded but found nothing to restore — a distinct,
            // non-alarming outcome the UI words differently from a failure.
            set({ lastError: toStoreError(new SubscriptionError('nothing_to_restore')) });
            return false;
          }
          return true;
        } catch (error) {
          set({ status: 'idle', lastError: toStoreError(error) });
          return false;
        }
      },

      clearError: () => set({ lastError: null }),
    }),
    {
      // v2: v1 persisted the pre-RevenueCat mock's entitlement state. Bumping
      // the key drops it rather than trusting a locally-set `isPro`.
      name: 'revive.subscription.v2',
      storage: createJSONStorage(() => AsyncStorage),
      // Persist only a display snapshot, so Pro UI paints instantly on a cold,
      // offline start instead of flashing the free tier. RevenueCat overwrites
      // it with the verified entitlement as soon as `refresh()` answers.
      partialize: (state) => ({
        isPro: state.isPro,
        plan: state.plan,
        trialEndsAt: state.trialEndsAt,
        renewsAt: state.renewsAt,
        willRenew: state.willRenew,
        isLifetime: state.isLifetime,
        appUserId: state.appUserId,
      }),
    },
  ),
);
