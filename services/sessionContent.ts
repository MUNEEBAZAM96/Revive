import type { RecoveryStage } from '@/database/schema';

/**
 * Pure content + types for the daily recovery session. No data-layer imports,
 * so the UI can use it without pulling in SQLite/Supabase. (While the app is in
 * UI-only mode, the repository-backed dailySessionService is disconnected; this
 * module holds the parts the UI actually needs.)
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

export interface Exercise {
  title: string;
  description: string;
  minutes: number;
}

export const STAGE_FOCUS: Record<RecoveryStage, string> = {
  Awareness: 'Understanding Your Triggers',
  Control: 'Building Self-Control',
  Rebuilding: 'Rebuilding Confidence',
  Growth: 'Sustaining Your Growth',
};

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

export function progressOf(completed: string[]): number {
  const done = SESSION_STEPS.filter((s) => completed.includes(s)).length;
  return done / SESSION_STEPS.length;
}
