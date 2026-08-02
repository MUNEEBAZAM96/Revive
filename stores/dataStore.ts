import { create } from 'zustand';

import { CalendarDay, dateKey, moodEmoji } from '@/components/dashboard/garden';
import type { DayStatus, Mood, RecoveryStage } from '@/database/schema';
import type { RewardAction } from '@/services/rewardService';
import {
  DailySession,
  progressOf,
  SessionStep,
  suggestExercise,
} from '@/services/sessionContent';
import type { OnboardingProfile } from '@/stores/appStore';
import { useGrowthStore } from '@/stores/growthStore';

/** Which Growth Energy action each ritual step represents (see rewardService). */
const STEP_REWARD: Partial<Record<SessionStep, RewardAction>> = {
  morning_checkin: 'daily_checkin',
  reflection: 'reflection',
  recovery_exercise: 'breathing',
};

/**
 * UI-ONLY MODE.
 *
 * This store is a self-contained, in-memory mock — it imports NOTHING from the
 * data layer (no SQLite, Supabase, sync, or repositories), so none of that is
 * bundled or run while we iterate on the UI. The public API is identical to the
 * real store, so screens don't change; re-point these actions at the
 * repositories to turn the local-first backend back on.
 */

export interface DashboardData {
  recoveryDays: number;
  longestStreak: number;
  currentStage: RecoveryStage | null;
  primaryGoal: string | null;
  checkedInToday: boolean;
  todayFocus: string;
  forestTrees: number;
  topTriggers: { trigger_type: string; frequency: number }[];
  coachSuggestion: string | null;
}

const MOCK_DASHBOARD: DashboardData = {
  recoveryDays: 42,
  longestStreak: 60,
  currentStage: 'Rebuilding',
  primaryGoal: 'Quit compulsive porn use',
  checkedInToday: false,
  todayFocus: 'Building Self-Control',
  forestTrees: 1,
  topTriggers: [
    { trigger_type: 'Night', frequency: 14 },
    { trigger_type: 'Stress', frequency: 9 },
  ],
  coachSuggestion:
    'I noticed evenings are usually your difficult time. Would you like to prepare a plan for tonight?',
};

function buildSession(completedSteps: string[]): DailySession {
  return {
    id: 'mock-session',
    date: new Date().toISOString().slice(0, 10),
    progress: progressOf(completedSteps),
    focus: MOCK_DASHBOARD.todayFocus,
    exercise: suggestExercise(null).title,
    completedSteps,
  };
}

/** Mock a month of check-ins for the calendar (current 44-day journey window). */
function mockMonth(year: number, month: number): CalendarDay[] {
  const now = new Date();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const records: CalendarDay[] = [];
  for (let d = 1; d <= daysInMonth; d += 1) {
    const date = new Date(year, month, d);
    if (date > now) break;
    const daysAgo = Math.round((now.getTime() - date.getTime()) / 86_400_000);
    if (daysAgo > 44) continue; // only within the current journey
    const isStorm = daysAgo === 9 || daysAgo === 23;
    records.push({
      date: dateKey(date),
      status: isStorm ? 'storm' : 'growth',
      checkedIn: daysAgo % 7 !== 3,
      moodEmoji: moodEmoji(isStorm ? 'struggling' : 'positive'),
      note: daysAgo === 9 ? 'Rough evening, but I opened the app instead.' : null,
      weatheredStorm: daysAgo === 9,
    });
  }
  return records;
}

interface DataState {
  dashboard: DashboardData | null;
  session: DailySession | null;
  monthRecords: CalendarDay[];
  loading: boolean;
  loadDashboard: () => Promise<void>;
  loadSession: () => Promise<void>;
  completeStep: (step: SessionStep) => Promise<void>;
  saveMood: (mood: Mood, dayStatus: DayStatus) => Promise<void>;
  saveReflection: (note: string) => Promise<void>;
  loadMonth: (year: number, month: number) => Promise<void>;
  saveCheckin: (input: unknown) => Promise<void>;
  completeOnboarding: (answers: OnboardingProfile) => Promise<void>;
  syncNow: () => Promise<void>;
}

export const useDataStore = create<DataState>((set, get) => ({
  dashboard: MOCK_DASHBOARD,
  session: buildSession([]),
  monthRecords: [],
  loading: false,

  loadDashboard: async () => {
    if (!get().dashboard) set({ dashboard: MOCK_DASHBOARD });
  },

  loadSession: async () => {
    if (!get().session) set({ session: buildSession([]) });
  },

  completeStep: async (step) => {
    const current = get().session?.completedSteps ?? [];
    if (current.includes(step)) return; // already done today — no re-reward
    const steps = [...current, step];
    const dashboard = get().dashboard ?? MOCK_DASHBOARD;
    set({
      session: buildSession(steps),
      dashboard: {
        ...dashboard,
        checkedInToday: dashboard.checkedInToday || steps.includes('morning_checkin'),
      },
    });

    // Meaningful actions earn Growth Energy — never just opening the app.
    const action = STEP_REWARD[step];
    if (action) useGrowthStore.getState().awardAction(action);
  },

  saveMood: async () => {
    await get().completeStep('morning_checkin');
  },

  saveReflection: async () => {
    await get().completeStep('reflection');
  },

  loadMonth: async (year, month) => {
    set({ monthRecords: mockMonth(year, month) });
  },

  saveCheckin: async () => {
    await get().completeStep('morning_checkin');
  },

  completeOnboarding: async () => {
    // No-op in UI-only mode.
  },

  syncNow: async () => {
    // No-op in UI-only mode.
  },
}));
