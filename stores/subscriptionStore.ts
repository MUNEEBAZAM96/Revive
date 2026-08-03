import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  purchasePlan,
  restorePurchases,
  SubscriptionError,
  type PlanId,
  type SubscriptionErrorCode,
} from '@/services/subscriptionService';

export type SubscriptionStatus = 'idle' | 'purchasing' | 'restoring';

export interface SubscriptionError_ {
  code: SubscriptionErrorCode;
  message: string;
}

interface SubscriptionState {
  /** Mirrors RevenueCat's `customerInfo.entitlements.active.pro` — the single source of truth Coach access is gated on. */
  isPro: boolean;
  plan: PlanId | null;
  trialEndsAt: string | null;
  renewsAt: string | null;
  /** True once this device has ever completed a purchase — lets the mock "Restore" flow behave believably after a debug downgrade. */
  everPurchased: boolean;
  status: SubscriptionStatus;
  lastError: SubscriptionError_ | null;

  purchase: (planId: PlanId) => Promise<boolean>;
  restore: () => Promise<boolean>;
  clearError: () => void;
  /** Dev-only: revert to the free tier without losing purchase history, so Restore has something to restore. Surfaced only in Settings' debug section. */
  debugDowngrade: () => void;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function renewalDateFor(planId: PlanId, from: Date): Date {
  const d = new Date(from);
  if (planId === 'monthly') d.setMonth(d.getMonth() + 1);
  else d.setFullYear(d.getFullYear() + 1);
  return d;
}

function toStoreError(error: unknown): SubscriptionError_ {
  if (error instanceof SubscriptionError) {
    return { code: error.code, message: error.message };
  }
  return { code: 'purchase_failed', message: 'Something went wrong. Please try again.' };
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      isPro: false,
      plan: null,
      trialEndsAt: null,
      renewsAt: null,
      everPurchased: false,
      status: 'idle',
      lastError: null,

      purchase: async (planId) => {
        set({ status: 'purchasing', lastError: null });
        try {
          const result = await purchasePlan(planId, { alreadyPro: get().isPro });
          const now = new Date();
          set({
            isPro: true,
            plan: result.plan,
            everPurchased: true,
            trialEndsAt: result.trialDays > 0 ? addDays(now, result.trialDays).toISOString() : null,
            renewsAt: renewalDateFor(result.plan, now).toISOString(),
            status: 'idle',
          });
          return true;
        } catch (error) {
          set({ status: 'idle', lastError: toStoreError(error) });
          return false;
        }
      },

      restore: async () => {
        set({ status: 'restoring', lastError: null });
        try {
          const result = await restorePurchases(get().everPurchased);
          const now = new Date();
          set({
            isPro: true,
            plan: result.plan,
            everPurchased: true,
            trialEndsAt: null,
            renewsAt: renewalDateFor(result.plan, now).toISOString(),
            status: 'idle',
          });
          return true;
        } catch (error) {
          set({ status: 'idle', lastError: toStoreError(error) });
          return false;
        }
      },

      clearError: () => set({ lastError: null }),

      debugDowngrade: () => set({ isPro: false, plan: null, trialEndsAt: null, renewsAt: null }),
    }),
    {
      name: 'revive.subscription.v1',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
