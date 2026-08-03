/**
 * Recovery Check-In — pure domain logic. No storage here; the Zustand store
 * (runtime) and the prepared SQLite repository (unwired) both build on these
 * same functions so the rules can't drift between the two.
 *
 * Design principle: one check-in represents "today." A gap of missed days
 * never gets backfilled with individual per-day questions (the product spec
 * is explicit: never ask "Monday? Tuesday?") — a catch-up check-in after a
 * gap is still exactly one row, dated today, with softer "Welcome Back" copy
 * in the UI. The days in between simply stay unrecorded.
 */

/**
 * No real multi-user auth is wired into the running app (it's disconnected —
 * see services/auth.ts's doc comment), and growthStore has no user concept
 * either. This keeps the check-in feature fully decoupled from that
 * disconnected layer rather than importing it just for an id.
 */
export const LOCAL_USER_ID = 'local-user';

export type CheckInStatus = 'success' | 'urge' | 'relapse';
export type TriggerType = 'stress' | 'boredom' | 'loneliness' | 'late_night' | 'social_media' | 'other';

export interface RecoveryCheckIn {
  id: string;
  userId: string;
  /** YYYY-MM-DD */
  date: string;
  status: CheckInStatus;
  /** 0 for success/urge; 1, 2, or 3 (meaning "3+") for relapse. */
  relapseCount: number;
  /** 1-5, only set when status is 'urge'. */
  urgeLevel: number | null;
  trigger: TriggerType | null;
  createdAt: string;
  synced: boolean;
}

export interface StatusMeta {
  emoji: string;
  /** Solid accent color — deliberately a warm rose for relapse, never a
   *  harsh pure red, consistent with the app's no-alarm-color design language. */
  color: string;
  /** Soft translucent tint for chips/backgrounds. */
  chipColor: string;
  label: string;
}

export const STATUS_META: Record<CheckInStatus, StatusMeta> = {
  success: {
    emoji: '🟢',
    color: '#3A8D6D',
    chipColor: 'rgba(58, 141, 109, 0.14)',
    label: 'Stayed on track',
  },
  urge: {
    emoji: '🟡',
    color: '#D9A441',
    chipColor: 'rgba(217, 164, 65, 0.16)',
    label: 'Had urges',
  },
  relapse: {
    emoji: '🔴',
    color: '#D1567B',
    chipColor: 'rgba(209, 86, 122, 0.14)',
    label: 'Relapse',
  },
};

export const TRIGGER_OPTIONS: { value: TriggerType; label: string }[] = [
  { value: 'stress', label: 'Stress' },
  { value: 'boredom', label: 'Boredom' },
  { value: 'loneliness', label: 'Loneliness' },
  { value: 'late_night', label: 'Late Night' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'other', label: 'Other' },
];

export function todayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function daysBetween(fromKey: string, toKey: string): number {
  const from = new Date(`${fromKey}T00:00:00`);
  const to = new Date(`${toKey}T00:00:00`);
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

/** True once a check-in already exists for today — the modal should stay closed. */
export function hasCheckedInToday(lastCheckInDate: string | null): boolean {
  return lastCheckInDate === todayKey();
}

/**
 * True when the gap since the last check-in is 2+ days, meaning the modal
 * should show the softer "Welcome Back" catch-up copy instead of the daily
 * framing. A first-ever check-in (no prior date) is NOT a catch-up — there's
 * nothing to welcome the user back from.
 */
export function isCatchUp(lastCheckInDate: string | null): boolean {
  if (!lastCheckInDate) return false;
  return daysBetween(lastCheckInDate, todayKey()) >= 2;
}

export interface CheckInInput {
  status: CheckInStatus;
  relapseCount?: number;
  urgeLevel?: number | null;
  trigger?: TriggerType | null;
}

/** Builds a complete check-in record for today from the modal's answers. */
export function buildCheckIn(userId: string, input: CheckInInput): RecoveryCheckIn {
  return {
    id: `${userId}-${todayKey()}`,
    userId,
    date: todayKey(),
    status: input.status,
    relapseCount: input.status === 'relapse' ? (input.relapseCount ?? 1) : 0,
    urgeLevel: input.status === 'urge' ? (input.urgeLevel ?? null) : null,
    trigger: input.status === 'relapse' ? (input.trigger ?? null) : null,
    createdAt: new Date().toISOString(),
    synced: false,
  };
}

/**
 * Current streak: consecutive days counting backward from the most recent
 * check-in where status was NOT 'relapse'. A relapse day breaks the streak;
 * a gap in check-ins (no record for a day) also breaks it — silence isn't
 * assumed to be a good day.
 */
export function calculateStreak(checkIns: RecoveryCheckIn[]): number {
  if (checkIns.length === 0) return 0;
  const byDate = new Map(checkIns.map((c) => [c.date, c]));

  let streak = 0;
  const cursor = new Date();
  // If today has no check-in yet, start counting from yesterday so an
  // in-progress day doesn't look like a broken streak.
  if (!byDate.has(todayKey(cursor))) cursor.setDate(cursor.getDate() - 1);

  while (true) {
    const key = todayKey(cursor);
    const entry = byDate.get(key);
    if (!entry || entry.status === 'relapse') break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/**
 * A simple, transparent "recovery score" for the dashboard: the share of the
 * last 30 tracked days that were success/urge rather than relapse (urge days
 * count as half-credit — noticing an urge and not acting on it is real
 * progress, just not a full clean day). Not an authoritative clinical
 * metric, just a gentle at-a-glance number.
 */
export function calculateRecoveryScore(checkIns: RecoveryCheckIn[]): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const cutoffKey = todayKey(cutoff);

  const recent = checkIns.filter((c) => c.date >= cutoffKey);
  if (recent.length === 0) return 0;

  const points = recent.reduce((sum, c) => {
    if (c.status === 'success') return sum + 1;
    if (c.status === 'urge') return sum + 0.5;
    return sum;
  }, 0);

  return Math.round((points / recent.length) * 100);
}
