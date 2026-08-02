import type { GameType } from './dailyChallengeService';
import {
  levelForEnergy,
  LevelProgress,
  levelProgress,
  LevelTitleId,
  stageForLevel,
  titleForLevel,
  TreeStageId,
} from './growthLevels';

/**
 * Growth Journey domain logic + Supabase-ready types. Pure module: the
 * growthStore owns state, this owns the rules. The prepared (unwired)
 * `database/migrations/003_revive_gamification.ts` mirrors these shapes for
 * when the local-first backend returns.
 */

// --- Supabase preparation ---------------------------------------------------

export interface GrowthProfile {
  id: string;
  user_id: string;
  revive_score: number;
  lifetime_score: number;
  diamonds: number;
  level: number;
  tree_stage: TreeStageId;
  total_games_completed: number;
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface GameSession {
  id: string;
  user_id: string;
  game_type: GameType;
  difficulty: 'easy' | 'medium' | 'hard';
  score: number;
  reward: number;
  duration: number;
  completed_at: string;
}

// --- Rules ------------------------------------------------------------------

export function todayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export interface EnergyGain {
  energy: number;
  level: number;
  levelTitle: LevelTitleId;
  treeStage: TreeStageId;
  leveledUp: boolean;
  titleChanged: boolean;
  stageChanged: boolean;
  /** Whole-percent tree growth toward the next level (for the celebration). */
  growthPercent: number;
}

/** Apply earned score and report what changed (level-ups, stage evolution). */
export function applyEnergy(currentEnergy: number, amount: number): EnergyGain {
  const before: LevelProgress = levelProgress(currentEnergy);
  const energy = currentEnergy + Math.max(0, amount);
  const after: LevelProgress = levelProgress(energy);

  const leveledUp = after.level > before.level;
  const growthPercent = leveledUp
    ? Math.max(1, Math.round(after.progress * 100))
    : Math.max(1, Math.round((after.progress - before.progress) * 100));

  return {
    energy,
    level: after.level,
    levelTitle: after.title.id,
    treeStage: after.stage.id,
    leveledUp,
    titleChanged: after.title.id !== before.title.id,
    stageChanged: after.stage.id !== before.stage.id,
    growthPercent,
  };
}

export { levelForEnergy, levelProgress, stageForLevel, titleForLevel };
