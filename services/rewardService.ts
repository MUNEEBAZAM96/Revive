/**
 * Revive Score + Diamonds reward rules.
 *
 * Revive Score (🌿) is earned generously across many meaningful actions.
 * Diamonds (💎) are the strict currency: this file is the ONLY place diamonds
 * are minted, and only for the exact sources the product spec allows —
 * completing the full daily playlist, a weekly streak milestone, unlocking an
 * achievement, a level milestone, and helping the community. Nothing else may
 * award a diamond; there is deliberately no generic "awardDiamonds(amount)"
 * escape hatch, so the constraint can't drift as the app grows.
 */

// --- Revive Score ------------------------------------------------------------

export type RewardAction =
  | 'daily_checkin'
  | 'reflection'
  | 'breathing'
  | 'game_completed'
  | 'coach_session'
  | 'community_positive'
  | 'mission_completed'
  | 'weekly_mission_completed'
  | 'achievement_unlocked';

export const REWARDS: Record<RewardAction, number> = {
  daily_checkin: 10,
  reflection: 20,
  breathing: 15,
  game_completed: 15,
  coach_session: 15,
  community_positive: 10,
  mission_completed: 10,
  weekly_mission_completed: 30,
  achievement_unlocked: 25,
};

/**
 * Score for repeating a training already completed today. Practice still
 * counts, but the full reward is once per day — keeps the loop healthy
 * instead of farmable.
 */
export const PRACTICE_REWARD = 5;

export function awardFor(action: RewardAction): number {
  return REWARDS[action];
}

// --- Diamonds (earn-only, never purchasable) --------------------------------

const DIAMOND_AMOUNTS = {
  allGamesComplete: 5,
  weeklyStreak: 3,
  achievement: 5,
  levelMilestone: 3,
  communityHelp: 2,
} as const;

/** Bonus for finishing every game in today's 5-game playlist. */
export function awardGameCompletionBonus(): number {
  return DIAMOND_AMOUNTS.allGamesComplete;
}

/** Diamonds for hitting a 7-day-multiple streak (7, 14, 21…). Otherwise 0. */
export function awardStreakMilestone(streakDays: number): number {
  return streakDays > 0 && streakDays % 7 === 0 ? DIAMOND_AMOUNTS.weeklyStreak : 0;
}

/** Diamonds for unlocking any achievement. */
export function awardAchievementDiamonds(): number {
  return DIAMOND_AMOUNTS.achievement;
}

/** Diamonds for reaching a level that's a multiple of 10. Otherwise 0. */
export function awardLevelMilestoneDiamonds(level: number): number {
  return level > 0 && level % 10 === 0 ? DIAMOND_AMOUNTS.levelMilestone : 0;
}

/** Diamonds for a positive, helpful community action. */
export function awardCommunityHelpDiamonds(): number {
  return DIAMOND_AMOUNTS.communityHelp;
}
