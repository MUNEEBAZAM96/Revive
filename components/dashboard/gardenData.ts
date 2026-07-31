/**
 * Mock data layer for the Recovery Garden and Journey Calendar.
 *
 * Design contract (agreed with the user): growth is cumulative and storms
 * never shrink or reset anything — a fall is recorded as weather, not
 * failure. All functions are pure/deterministic so Supabase can replace this
 * module without touching the UI.
 */

export type DayStatus = 'growth' | 'storm';

export interface DayRecord {
  /** Local date key, YYYY-MM-DD. */
  date: string;
  status: DayStatus;
  checkedIn: boolean;
  mood?: string;
  note?: string;
  /** Used the support tools during an urge that day. */
  weatheredStorm?: boolean;
}

export interface PastJourney {
  growthDays: number;
}

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

/** Summary powering the Garden card. Mock until Supabase is wired up. */
export const gardenSummary = {
  growthDays: 42,
  longestJourney: 60,
  checkedInToday: false,
  pastJourneys: [{ growthDays: 28 }] as PastJourney[],
};

// Current journey: 44 calendar days (42 growth + 2 storms). Today has no
// record yet — it's written when the user checks in.
const JOURNEY_LENGTH_DAYS = 44;
const STORM_DAYS_AGO: Record<number, Pick<DayRecord, 'mood' | 'note' | 'weatheredStorm'>> = {
  9: {
    mood: '😕',
    note: 'Rough evening, but I opened the app instead.',
    weatheredStorm: true,
  },
  23: { mood: '😞' },
};
const MOCK_MOODS = ['🙂', '😐', '😄', '🙂'];

let recordCache: Map<string, DayRecord> | null = null;

function buildRecords(): Map<string, DayRecord> {
  const records = new Map<string, DayRecord>();
  const today = new Date();
  for (let daysAgo = 1; daysAgo <= JOURNEY_LENGTH_DAYS; daysAgo += 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - daysAgo);
    const key = dateKey(day);
    const storm = STORM_DAYS_AGO[daysAgo];
    records.set(key, {
      date: key,
      status: storm ? 'storm' : 'growth',
      // Miss a check-in roughly once a week so the calendar looks honest.
      checkedIn: daysAgo % 7 !== 3,
      mood: storm?.mood ?? MOCK_MOODS[daysAgo % MOCK_MOODS.length],
      note: storm?.note,
      weatheredStorm: storm?.weatheredStorm,
    });
  }
  return records;
}

export function recordFor(key: string): DayRecord | undefined {
  if (!recordCache) recordCache = buildRecords();
  return recordCache.get(key);
}

export interface MonthStats {
  growthDays: number;
  checkIns: number;
}

export function monthStats(year: number, month: number): MonthStats {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let growthDays = 0;
  let checkIns = 0;
  for (let day = 1; day <= daysInMonth; day += 1) {
    const record = recordFor(dateKey(new Date(year, month, day)));
    if (!record) continue;
    if (record.status === 'growth') growthDays += 1;
    if (record.checkedIn) checkIns += 1;
  }
  return { growthDays, checkIns };
}
