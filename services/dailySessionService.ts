import { checkinRepository } from '@/repositories/checkinRepository';
import { profileRepository } from '@/repositories/profileRepository';
import type { DayStatus, Mood, RecoveryStage } from '@/database/schema';

/**
 * The "daily recovery ritual" as a service. It models today's session on top of
 * the existing local-first `daily_checkins` row (real data, Supabase-ready) —
 * the four ritual steps live in that row's `completed_exercises` JSON, so there
 * is no new table. Screens talk to this via the data store, never directly.
 */

/** The four activities that make up a full day. Progress = done / 4. */
export const SESSION_STEPS = [
  'morning_checkin',
  'recovery_exercise',
  'reflection',
  'evening_review',
] as const;

export type SessionStep = (typeof SESSION_STEPS)[number];

export interface DailySession {
  id: string;
  date: string;
  /** 0..1 — completed steps / total. */
  progress: number;
  focus: string;
  exercise: string;
  completedSteps: string[];
}

const STAGE_FOCUS: Record<RecoveryStage, string> = {
  Awareness: 'Understanding Your Triggers',
  Control: 'Building Self-Control',
  Rebuilding: 'Rebuilding Confidence',
  Growth: 'Sustaining Your Growth',
};

export interface Exercise {
  title: string;
  description: string;
  minutes: number;
}

/** Pure mapping from the user's current state to a short recovery exercise. */
export function suggestExercise(state: string | null): Exercise {
  switch (state) {
    case 'Stress':
      return {
        title: '3 Minute Reset',
        description: 'Slow the storm inside with three rounds of paced breathing.',
        minutes: 3,
      };
    case 'Loneliness':
      return {
        title: 'Connection Exercise',
        description: 'Reach toward one person, or write a note to your future self.',
        minutes: 5,
      };
    case 'Boredom':
      return {
        title: '5 Minute Redirect',
        description: 'Channel restless energy into one small, kind action.',
        minutes: 5,
      };
    case 'Old memories':
      return {
        title: 'Grounding Practice',
        description: 'Return to now with the 5-4-3-2-1 senses exercise.',
        minutes: 4,
      };
    case 'Confidence issues':
      return {
        title: 'Strengths Reflection',
        description: 'Name three things you have already overcome.',
        minutes: 4,
      };
    default:
      return {
        title: '10 Minute Pause',
        description: 'Urges pass. Sit with this one and let the wave crest and fall.',
        minutes: 10,
      };
  }
}

const today = () => new Date().toISOString().slice(0, 10);

function progressOf(completed: string[]): number {
  const done = SESSION_STEPS.filter((s) => completed.includes(s)).length;
  return done / SESSION_STEPS.length;
}

export const dailySessionService = {
  async getTodaySession(userId: string): Promise<DailySession> {
    const [checkin, profile] = await Promise.all([
      checkinRepository.getByDate(userId, today()),
      profileRepository.get(userId),
    ]);
    const completedSteps = checkin?.completed_exercises ?? [];
    const stage = profile?.current_stage ?? 'Control';
    return {
      id: checkin?.id ?? `${userId}-${today()}`,
      date: today(),
      progress: progressOf(completedSteps),
      focus: STAGE_FOCUS[stage],
      exercise: suggestExercise(null).title,
      completedSteps,
    };
  },

  /** Mark a ritual step complete (idempotent) on today's check-in row. */
  async completeSessionStep(userId: string, step: SessionStep): Promise<void> {
    const existing = await checkinRepository.getByDate(userId, today());
    const current = existing?.completed_exercises ?? [];
    if (current.includes(step)) return;
    await checkinRepository.upsertForDate(userId, {
      completed_exercises: [...current, step],
    });
  },

  async saveMoodCheck(userId: string, mood: Mood, dayStatus: DayStatus): Promise<void> {
    const existing = await checkinRepository.getByDate(userId, today());
    const current = existing?.completed_exercises ?? [];
    await checkinRepository.upsertForDate(userId, {
      mood,
      day_status: dayStatus,
      completed_exercises: current.includes('morning_checkin')
        ? current
        : [...current, 'morning_checkin'],
    });
  },

  async saveReflection(userId: string, note: string): Promise<void> {
    const existing = await checkinRepository.getByDate(userId, today());
    const current = existing?.completed_exercises ?? [];
    await checkinRepository.upsertForDate(userId, {
      reflection_note: note,
      completed_exercises: current.includes('reflection') ? current : [...current, 'reflection'],
    });
  },
};
