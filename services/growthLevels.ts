/**
 * Level configuration for Revive 2.0.
 *
 * Two parallel, intentionally distinct naming systems share the same XP curve:
 *   - LEVEL_TITLES: the identity shown in the header ("Level 12 · Rebuilding").
 *   - TREE_STAGES: the visual tree shown in the Journey tab (Seed → Forest).
 * They don't have to align 1:1 — a title change and a tree evolution are two
 * different kinds of "you've grown," and staggering them keeps both feeling
 * meaningful across all 50 levels instead of both landmarks happening at once.
 */

export const MAX_LEVEL = 50;

/** Cumulative Revive Score required to *reach* `level` (level 1 = 0). */
export function energyForLevel(level: number): number {
  if (level <= 1) return 0;
  const n = Math.min(level, MAX_LEVEL);
  // sum of 50k for k = 2..n  →  50 * (n(n+1)/2 − 1)
  // L2: 100 · L3: 250 · L4: 450 · L5: 700 — matches the product spec exactly.
  return 50 * ((n * (n + 1)) / 2 - 1);
}

export function levelForEnergy(energy: number): number {
  let level = 1;
  while (level < MAX_LEVEL && energy >= energyForLevel(level + 1)) level += 1;
  return level;
}

// --- Level titles ------------------------------------------------------------

export type LevelTitleId =
  | 'beginning'
  | 'growing'
  | 'rebuilding'
  | 'strong_roots'
  | 'inner_strength'
  | 'flourishing';

export interface LevelTitle {
  id: LevelTitleId;
  fromLevel: number;
  label: string;
}

export const LEVEL_TITLES: LevelTitle[] = [
  { id: 'beginning', fromLevel: 1, label: 'Beginning' },
  { id: 'growing', fromLevel: 5, label: 'Growing' },
  { id: 'rebuilding', fromLevel: 10, label: 'Rebuilding' },
  { id: 'strong_roots', fromLevel: 20, label: 'Strong Roots' },
  { id: 'inner_strength', fromLevel: 35, label: 'Inner Strength' },
  { id: 'flourishing', fromLevel: 50, label: 'Flourishing' },
];

export function titleForLevel(level: number): LevelTitle {
  return [...LEVEL_TITLES].reverse().find((t) => level >= t.fromLevel) ?? LEVEL_TITLES[0];
}

// --- Tree stages ---------------------------------------------------------

export type TreeStageId =
  | 'stage_1_seed'
  | 'stage_2_sprout'
  | 'stage_3_plant'
  | 'stage_4_young_tree'
  | 'stage_5_strong_tree'
  | 'stage_6_forest';

export interface TreeStage {
  id: TreeStageId;
  fromLevel: number;
  emoji: string;
  label: string;
}

export const TREE_STAGES: TreeStage[] = [
  { id: 'stage_1_seed', fromLevel: 1, emoji: '🌱', label: 'Seed' },
  { id: 'stage_2_sprout', fromLevel: 5, emoji: '🌿', label: 'Sprout' },
  { id: 'stage_3_plant', fromLevel: 12, emoji: '🪴', label: 'Plant' },
  { id: 'stage_4_young_tree', fromLevel: 20, emoji: '🌳', label: 'Young Tree' },
  { id: 'stage_5_strong_tree', fromLevel: 35, emoji: '🌲', label: 'Strong Tree' },
  { id: 'stage_6_forest', fromLevel: 50, emoji: '🌳🌲🌳', label: 'Forest' },
];

export function stageForLevel(level: number): TreeStage {
  return [...TREE_STAGES].reverse().find((s) => level >= s.fromLevel) ?? TREE_STAGES[0];
}

export function nextTreeStageFor(level: number): TreeStage | null {
  return TREE_STAGES.find((s) => s.fromLevel > level) ?? null;
}

// --- Composite progress --------------------------------------------------

export interface LevelProgress {
  level: number;
  title: LevelTitle;
  stage: TreeStage;
  /** Score accumulated within the current level. */
  current: number;
  /** Score needed within the current level to reach the next. */
  needed: number;
  /** 0..1 toward the next level (1 at max level). */
  progress: number;
}

export function levelProgress(energy: number): LevelProgress {
  const level = levelForEnergy(energy);
  const floor = energyForLevel(level);
  const ceiling = energyForLevel(level + 1);
  const needed = level >= MAX_LEVEL ? 0 : ceiling - floor;
  const current = energy - floor;
  return {
    level,
    title: titleForLevel(level),
    stage: stageForLevel(level),
    current,
    needed,
    progress: needed === 0 ? 1 : Math.min(current / needed, 1),
  };
}
