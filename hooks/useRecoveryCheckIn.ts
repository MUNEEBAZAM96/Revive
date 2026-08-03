import { useMemo } from 'react';

import {
  calculateRecoveryScore,
  calculateStreak,
  CheckInInput,
  hasCheckedInToday,
  isCatchUp,
  LOCAL_USER_ID,
  RecoveryCheckIn,
  todayKey,
} from '@/services/checkInService';
import { useRecoveryStore } from '@/stores/recoveryStore';

export interface UseRecoveryCheckIn {
  checkIns: RecoveryCheckIn[];
  todayCheckIn: RecoveryCheckIn | null;
  lastCheckInDate: string | null;
  /** True once today is already recorded — the modal should stay closed. */
  hasCheckedInToday: boolean;
  /** True when 2+ days were missed — the modal should use "Welcome Back" copy. */
  isCatchUp: boolean;
  /** Consecutive non-relapse days, counting back from today/yesterday. */
  currentStreak: number;
  /** 0-100, share of the last 30 tracked days that weren't a relapse. */
  recoveryScore: number;
  submitCheckIn: (input: CheckInInput) => RecoveryCheckIn;
}

/**
 * The single hook screens use to read Recovery Check-In state and record a
 * new one. All derived values (streak, score, catch-up) are recomputed from
 * the persisted `checkIns` array on every call — cheap for a small local
 * array, and it means the values are always correct for "right now" rather
 * than a stale snapshot from whenever the app last computed them.
 */
export function useRecoveryCheckIn(): UseRecoveryCheckIn {
  const checkIns = useRecoveryStore((s) => s.checkIns);
  const submit = useRecoveryStore((s) => s.submitCheckIn);

  return useMemo(() => {
    const sorted = [...checkIns].sort((a, b) => (a.date < b.date ? 1 : -1));
    const lastCheckInDate = sorted[0]?.date ?? null;
    const todayCheckIn = sorted.find((c) => c.date === todayKey()) ?? null;

    return {
      checkIns,
      todayCheckIn,
      lastCheckInDate,
      hasCheckedInToday: hasCheckedInToday(lastCheckInDate),
      isCatchUp: isCatchUp(lastCheckInDate),
      currentStreak: calculateStreak(checkIns),
      recoveryScore: calculateRecoveryScore(checkIns),
      submitCheckIn: (input: CheckInInput) => submit(LOCAL_USER_ID, input),
    };
  }, [checkIns, submit]);
}
