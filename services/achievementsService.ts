import type { GameType } from './dailyChallengeService';

/**
 * The 9 named achievements. Each unlock condition is a pure function over a
 * small stats snapshot the growth store maintains — no magic thresholds
 * scattered through the UI, one readable source of truth.
 */

export type AchievementId =
  | 'first_step'
  | 'seven_day_consistency'
  | 'hundred_games'
  | 'focus_master'
  | 'mind_trainer'
  | 'strong_roots'
  | 'impulse_warrior'
  | 'morning_hero'
  | 'community_helper';

export interface AchievementStats {
  lifetimeGamesCompleted: number;
  longestStreak: number;
  level: number;
  checkinsCount: number;
  communityInteractionsCount: number;
  gameTypeCounts: Partial<Record<GameType, number>>;
}

const FOCUS_GAME_TYPES: GameType[] = [
  'memory_garden',
  'reaction_focus',
  'logic_puzzle',
  'number_recall',
  'color_focus',
];

function focusGamesCompleted(stats: AchievementStats): number {
  return FOCUS_GAME_TYPES.reduce((sum, type) => sum + (stats.gameTypeCounts[type] ?? 0), 0);
}

export interface AchievementDef {
  id: AchievementId;
  title: string;
  emoji: string;
  description: string;
  isUnlocked: (stats: AchievementStats) => boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_step',
    title: 'First Step',
    emoji: '🌱',
    description: 'Complete your first mind-training game.',
    isUnlocked: (s) => s.lifetimeGamesCompleted >= 1,
  },
  {
    id: 'seven_day_consistency',
    title: '7 Day Consistency',
    emoji: '📅',
    description: 'Keep a 7-day streak alive.',
    isUnlocked: (s) => s.longestStreak >= 7,
  },
  {
    id: 'hundred_games',
    title: '100 Games',
    emoji: '💯',
    description: 'Complete 100 games in total.',
    isUnlocked: (s) => s.lifetimeGamesCompleted >= 100,
  },
  {
    id: 'focus_master',
    title: 'Focus Master',
    emoji: '🎯',
    description: 'Complete 20 focus-training games.',
    isUnlocked: (s) => focusGamesCompleted(s) >= 20,
  },
  {
    id: 'mind_trainer',
    title: 'Mind Trainer',
    emoji: '🧠',
    description: 'Complete 50 games in total.',
    isUnlocked: (s) => s.lifetimeGamesCompleted >= 50,
  },
  {
    id: 'strong_roots',
    title: 'Strong Roots',
    emoji: '🌳',
    description: 'Reach Level 20.',
    isUnlocked: (s) => s.level >= 20,
  },
  {
    id: 'impulse_warrior',
    title: 'Impulse Warrior',
    emoji: '🔥',
    description: 'Complete 30 Impulse Control games.',
    isUnlocked: (s) => (s.gameTypeCounts.impulse_control ?? 0) >= 30,
  },
  {
    id: 'morning_hero',
    title: 'Morning Hero',
    emoji: '🌅',
    description: 'Check in 10 times.',
    isUnlocked: (s) => s.checkinsCount >= 10,
  },
  {
    id: 'community_helper',
    title: 'Community Helper',
    emoji: '🤝',
    description: 'Encourage the community 5 times.',
    isUnlocked: (s) => s.communityInteractionsCount >= 5,
  },
];

/** Achievements newly unlocked by this stats snapshot that weren't already. */
export function newlyUnlocked(
  stats: AchievementStats,
  alreadyUnlocked: AchievementId[],
): AchievementDef[] {
  return ACHIEVEMENTS.filter(
    (a) => !alreadyUnlocked.includes(a.id) && a.isUnlocked(stats),
  );
}
