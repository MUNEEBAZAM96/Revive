import type { RecoveryCheckIn, TriggerType } from '@/services/checkInService';

/**
 * The structured context every Coach request is grounded in. Built fresh
 * from local store snapshots right before a message is sent — never cached,
 * since streaks/scores/triggers change between conversations. Kept small and
 * flat on purpose: this is the "only send what's necessary" payload described
 * for the future backend (see coachService.ts doc comment) — no raw message
 * history dumps, no full check-in objects, just the derived signals a coach
 * reply actually needs.
 */
export interface CoachContext {
  currentStreak: number;
  longestStreak: number;
  recoveryScore: number;
  reviveScore: number;
  level: number;
  diamonds: number;
  gamesCompletedToday: number;
  gamesTotalToday: number;
  achievementsUnlocked: number;
  primaryGoal: string | null;
  focusAreas: string[];
  /** Most frequent relapse/urge triggers, most common first (max 3). */
  commonTriggers: TriggerType[];
  /** True if today's check-in already happened. */
  checkedInToday: boolean;
  lastStatus: 'success' | 'urge' | 'relapse' | null;
}

export interface BuildCoachContextInput {
  checkIns: RecoveryCheckIn[];
  currentStreak: number;
  longestStreak: number;
  recoveryScore: number;
  hasCheckedInToday: boolean;
  reviveScore: number;
  level: number;
  diamonds: number;
  gamesCompletedToday: number;
  gamesTotalToday: number;
  achievementsUnlocked: number;
  primaryGoal: string | null;
  focusAreas: string[];
}

function topTriggers(checkIns: RecoveryCheckIn[], max = 3): TriggerType[] {
  const counts = new Map<TriggerType, number>();
  for (const c of checkIns) {
    if (!c.trigger) continue;
    counts.set(c.trigger, (counts.get(c.trigger) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([trigger]) => trigger);
}

export function buildCoachContext(input: BuildCoachContextInput): CoachContext {
  const sorted = [...input.checkIns].sort((a, b) => (a.date < b.date ? 1 : -1));
  const last = sorted[0] ?? null;

  return {
    currentStreak: input.currentStreak,
    longestStreak: input.longestStreak,
    recoveryScore: input.recoveryScore,
    reviveScore: input.reviveScore,
    level: input.level,
    diamonds: input.diamonds,
    gamesCompletedToday: input.gamesCompletedToday,
    gamesTotalToday: input.gamesTotalToday,
    achievementsUnlocked: input.achievementsUnlocked,
    primaryGoal: input.primaryGoal,
    focusAreas: input.focusAreas,
    commonTriggers: topTriggers(input.checkIns),
    checkedInToday: input.hasCheckedInToday,
    lastStatus: last?.status ?? null,
  };
}
