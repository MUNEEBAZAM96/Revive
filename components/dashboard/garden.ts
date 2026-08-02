import { DayStatus, Mood } from '@/database/schema';

/**
 * Pure presentation helpers for the Recovery Garden. No data lives here — the
 * repositories/SQLite are the source of truth. These map growth to tree stages
 * and moods to emoji for the calendar and garden card.
 */

export type { DayStatus };

export const MILESTONES = [
  { days: 0, emoji: '🌱', label: 'Seed' },
  { days: 30, emoji: '🌿', label: 'Plant' },
  { days: 90, emoji: '🌳', label: 'Tree' },
] as const;

export type Milestone = (typeof MILESTONES)[number];

export function stageFor(days: number): Milestone {
  return [...MILESTONES].reverse().find((m) => days >= m.days) ?? MILESTONES[0];
}

export function nextMilestoneFor(days: number): Milestone | null {
  return MILESTONES.find((m) => m.days > days) ?? null;
}

export function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export interface MoodOption {
  value: Mood;
  emoji: string;
  label: string;
}

export const MOOD_OPTIONS: MoodOption[] = [
  { value: 'heavy', emoji: '😔', label: 'Heavy' },
  { value: 'normal', emoji: '😐', label: 'Normal' },
  { value: 'positive', emoji: '🙂', label: 'Positive' },
  { value: 'struggling', emoji: '🔥', label: 'Struggling' },
];

export function moodEmoji(value: string | null): string {
  return MOOD_OPTIONS.find((m) => m.value === value)?.emoji ?? '';
}

/** A single day as the Journey Calendar renders it. */
export interface CalendarDay {
  date: string;
  status: DayStatus;
  checkedIn: boolean;
  moodEmoji: string;
  note: string | null;
  weatheredStorm: boolean;
}
