import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { buildCheckIn, CheckInInput, RecoveryCheckIn } from '@/services/checkInService';

/**
 * The Recovery Check-In data store — persisted locally (AsyncStorage). Kept
 * deliberately lean: it holds only the raw `checkIns` array and one action to
 * record today's answer. Everything derived (streak, score, whether the
 * catch-up modal should show) is computed fresh from this array by
 * `useRecoveryCheckIn` rather than cached here — dates shift as real time
 * passes, so cached derived fields would silently go stale between app opens.
 */
export interface RecoveryState {
  checkIns: RecoveryCheckIn[];
  /** Records today's check-in (replaces any existing entry for today). */
  submitCheckIn: (userId: string, input: CheckInInput) => RecoveryCheckIn;
}

export const useRecoveryStore = create<RecoveryState>()(
  persist(
    (set, get) => ({
      checkIns: [],

      submitCheckIn: (userId, input) => {
        const checkIn = buildCheckIn(userId, input);
        const withoutToday = get().checkIns.filter((c) => c.date !== checkIn.date);
        set({ checkIns: [...withoutToday, checkIn] });
        return checkIn;
      },
    }),
    {
      name: 'revive.recovery',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
