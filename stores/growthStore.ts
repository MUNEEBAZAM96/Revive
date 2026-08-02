import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  AchievementDef,
  AchievementId,
  AchievementStats,
  newlyUnlocked,
} from '@/services/achievementsService';
import {
  CosmeticCategory,
  DEFAULT_UNLOCKED_COSMETICS,
  cosmeticById,
} from '@/services/cosmeticsService';
import {
  challengeFor,
  GameType,
  generateDailyPlaylist,
  MindChallenge,
} from '@/services/dailyChallengeService';
import type { Difficulty, GameResult } from '@/services/gameEngine';
import { applyEnergy, EnergyGain, todayKey } from '@/services/growthService';
import type { TreeStageId, LevelTitleId } from '@/services/growthLevels';
import { DAILY_MISSIONS, missionDef, MissionId } from '@/services/missionsService';
import {
  awardAchievementDiamonds,
  awardCommunityHelpDiamonds,
  awardFor,
  awardGameCompletionBonus,
  awardLevelMilestoneDiamonds,
  awardStreakMilestone,
  PRACTICE_REWARD,
  RewardAction,
} from '@/services/rewardService';

/**
 * The Revive Growth Journey state — the single persisted (AsyncStorage) source
 * of truth for score, diamonds, level, streak, today's game playlist, daily
 * missions, achievements, and cosmetics. Level/title/tree-stage are always
 * derived from `reviveScore` via `applyEnergy`/`levelProgress` and set
 * together, so they can never drift from the rules.
 */

interface PlaylistState {
  date: string;
  games: { gameType: GameType; completed: boolean }[];
}

interface MissionsState {
  date: string;
  completed: Partial<Record<MissionId, boolean>>;
}

export interface GameCompletionSummary extends EnergyGain {
  earned: number;
  diamondsEarned: number;
  allGamesComplete: boolean;
  newAchievements: AchievementDef[];
}

export interface MissionCompletionSummary {
  earned: number;
  diamondsEarned: number;
  newAchievements: AchievementDef[];
}

export interface GrowthState {
  // Currency
  reviveScore: number;
  /** Cumulative total ever earned. Currently always mirrors reviveScore —
   *  kept as its own field because nothing decreases it, ready for a future
   *  feature that spends/resets current score without losing lifetime history. */
  lifetimeScore: number;
  diamonds: number;

  // Level (derived + stored together, never set independently)
  level: number;
  levelTitle: LevelTitleId;
  treeStage: TreeStageId;

  // Streak
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;

  // Lifetime stats (drive achievements)
  lifetimeGamesCompleted: number;
  gameTypeCounts: Partial<Record<GameType, number>>;
  checkinsCount: number;
  communityInteractionsCount: number;

  // Daily playlist + missions (regenerate on date change)
  todaysPlaylist: PlaylistState;
  playlistHistory: { date: string; gameTypes: GameType[] }[];
  dailyMissions: MissionsState;
  /** YYYY-MM-DD of the last claimed daily streak reward. */
  lastRewardClaimDate: string;

  // Unlocks
  unlockedAchievements: AchievementId[];
  unlockedCosmetics: string[];
  /** Badges aren't "equipped" the way frames/themes are — just displayed. */
  equippedCosmetics: Record<Exclude<CosmeticCategory, 'badge'>, string>;

  // --- actions ---
  /** Ensures today's playlist/missions are fresh; call on Dashboard mount. */
  loadPlaylist: () => void;
  /** Today's playlist as full challenge objects + completion flags. */
  getTodaysGames: () => { challenge: MindChallenge; completed: boolean }[];
  isMissionDone: (id: MissionId) => boolean;
  /** Record a finished game. Handles score, diamonds, streak, achievements. */
  completeGame: (result: GameResult, difficulty: Difficulty) => GameCompletionSummary;
  /** Record a non-game mission (check-in, coach, insight, community…). */
  completeMission: (id: MissionId) => MissionCompletionSummary;
  /** Award score for a meaningful action outside games/missions. */
  awardAction: (action: RewardAction) => void;
  purchaseCosmetic: (id: string) => boolean;
  equipCosmetic: (category: Exclude<CosmeticCategory, 'badge'>, id: string) => void;
  /** True once today's streak reward has been claimed. */
  isDailyRewardClaimed: () => boolean;
  /** Claim today's streak bonus (idempotent — no-op if already claimed). */
  claimDailyReward: () => { earned: number };
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return todayKey(d);
}

function emptyPlaylist(): PlaylistState {
  return { date: '', games: [] };
}

function emptyMissions(): MissionsState {
  return { date: '', completed: {} };
}

export const useGrowthStore = create<GrowthState>()(
  persist(
    (set, get) => ({
      reviveScore: 0,
      lifetimeScore: 0,
      diamonds: 0,

      level: 1,
      levelTitle: 'beginning',
      treeStage: 'stage_1_seed',

      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: '',

      lifetimeGamesCompleted: 0,
      gameTypeCounts: {},
      checkinsCount: 0,
      communityInteractionsCount: 0,

      todaysPlaylist: emptyPlaylist(),
      playlistHistory: [],
      dailyMissions: emptyMissions(),
      lastRewardClaimDate: '',

      unlockedAchievements: [],
      unlockedCosmetics: [...DEFAULT_UNLOCKED_COSMETICS],
      equippedCosmetics: {
        garden_theme: 'garden_default',
        profile_frame: 'frame_none',
        app_theme: 'theme_default',
      },

      // NOTE: loadPlaylist is the ONLY place day-rollover runs outside a user
      // action (completeGame/completeMission already ensure it themselves).
      // Call it from a useEffect on mount — never from a selector, since
      // selectors run during render and must never call `set()`.
      loadPlaylist: () => {
        ensurePlaylist(get, set);
      },

      getTodaysGames: () => {
        return get().todaysPlaylist.games.map((g) => ({
          challenge: challengeFor(g.gameType),
          completed: g.completed,
        }));
      },

      isMissionDone: (id) => {
        return get().dailyMissions.completed[id] === true;
      },

      completeGame: (result, _difficulty) => {
        ensurePlaylist(get, set);
        const state = get();
        const entry = state.todaysPlaylist.games.find((g) => g.gameType === result.gameType);
        const firstTimeToday = entry ? !entry.completed : false;
        const earned = firstTimeToday ? result.reward : PRACTICE_REWARD;

        const gain = applyEnergy(state.reviveScore, earned);
        let diamondsEarned = 0;

        const updatedGames = entry
          ? state.todaysPlaylist.games.map((g) =>
              g.gameType === result.gameType ? { ...g, completed: true } : g,
            )
          : state.todaysPlaylist.games;

        const lifetimeGamesCompleted = firstTimeToday
          ? state.lifetimeGamesCompleted + 1
          : state.lifetimeGamesCompleted;
        const gameTypeCounts = firstTimeToday
          ? {
              ...state.gameTypeCounts,
              [result.gameType]: (state.gameTypeCounts[result.gameType] ?? 0) + 1,
            }
          : state.gameTypeCounts;

        let missionsCompleted = state.dailyMissions.completed;
        let missionScoreBonus = 0;
        const allGamesComplete = updatedGames.length > 0 && updatedGames.every((g) => g.completed);
        if (allGamesComplete && !missionsCompleted.complete_5_games) {
          missionsCompleted = { ...missionsCompleted, complete_5_games: true };
          missionScoreBonus = missionDef('complete_5_games').reward;
          diamondsEarned += awardGameCompletionBonus();
        }

        const gainAfterMission =
          missionScoreBonus > 0 ? applyEnergy(gain.energy, missionScoreBonus) : gain;

        let currentStreak = state.currentStreak;
        let longestStreak = state.longestStreak;
        let lastActiveDate = state.lastActiveDate;
        if (firstTimeToday) {
          const bumped = bumpStreak(state);
          currentStreak = bumped.currentStreak;
          longestStreak = bumped.longestStreak;
          lastActiveDate = bumped.lastActiveDate;
          diamondsEarned += bumped.diamondsEarned;
        }

        const stats: AchievementStats = {
          lifetimeGamesCompleted,
          longestStreak,
          level: gainAfterMission.level,
          checkinsCount: state.checkinsCount,
          communityInteractionsCount: state.communityInteractionsCount,
          gameTypeCounts,
        };
        const newAchievements = newlyUnlocked(stats, state.unlockedAchievements);
        const achievementUnlock = applyAchievements(
          gainAfterMission.energy,
          state.unlockedAchievements,
          state.unlockedCosmetics,
          newAchievements,
        );
        const finalGain = achievementUnlock.finalEnergyGain;

        // Level-milestone diamonds check against the FINAL level (including
        // any achievement score that pushed the user over a level boundary).
        if (finalGain.leveledUp || finalGain.level > gain.level) {
          diamondsEarned += awardLevelMilestoneDiamonds(finalGain.level);
        }

        set({
          reviveScore: finalGain.energy,
          lifetimeScore: finalGain.energy,
          level: finalGain.level,
          levelTitle: finalGain.levelTitle,
          treeStage: finalGain.treeStage,
          currentStreak,
          longestStreak,
          lastActiveDate,
          lifetimeGamesCompleted,
          gameTypeCounts,
          todaysPlaylist: { ...state.todaysPlaylist, games: updatedGames },
          dailyMissions: { ...state.dailyMissions, completed: missionsCompleted },
          unlockedAchievements: achievementUnlock.unlockedAchievements,
          unlockedCosmetics: achievementUnlock.unlockedCosmetics,
          diamonds: state.diamonds + diamondsEarned + achievementUnlock.diamondsFromAchievements,
        });

        return {
          ...finalGain,
          earned: earned + missionScoreBonus + achievementUnlock.scoreFromAchievements,
          diamondsEarned: diamondsEarned + achievementUnlock.diamondsFromAchievements,
          allGamesComplete,
          newAchievements,
        };
      },

      completeMission: (id) => {
        ensurePlaylist(get, set);
        const state = get();
        if (state.dailyMissions.completed[id]) {
          return { earned: 0, diamondsEarned: 0, newAchievements: [] };
        }

        const def = missionDef(id);
        const gain = applyEnergy(state.reviveScore, def.reward);
        let diamondsEarned = def.awardsDiamonds && id === 'community_interaction'
          ? awardCommunityHelpDiamonds()
          : 0;

        const checkinsCount = id === 'daily_checkin' ? state.checkinsCount + 1 : state.checkinsCount;
        const communityInteractionsCount =
          id === 'community_interaction'
            ? state.communityInteractionsCount + 1
            : state.communityInteractionsCount;

        const bumped = bumpStreak(state);
        diamondsEarned += bumped.diamondsEarned;

        const stats: AchievementStats = {
          lifetimeGamesCompleted: state.lifetimeGamesCompleted,
          longestStreak: bumped.longestStreak,
          level: gain.level,
          checkinsCount,
          communityInteractionsCount,
          gameTypeCounts: state.gameTypeCounts,
        };
        const newAchievements = newlyUnlocked(stats, state.unlockedAchievements);
        const achievementUnlock = applyAchievements(
          gain.energy,
          state.unlockedAchievements,
          state.unlockedCosmetics,
          newAchievements,
        );
        const finalGain = achievementUnlock.finalEnergyGain;
        if (finalGain.leveledUp || finalGain.level > gain.level) {
          diamondsEarned += awardLevelMilestoneDiamonds(finalGain.level);
        }

        set({
          reviveScore: finalGain.energy,
          lifetimeScore: finalGain.energy,
          level: finalGain.level,
          levelTitle: finalGain.levelTitle,
          treeStage: finalGain.treeStage,
          currentStreak: bumped.currentStreak,
          longestStreak: bumped.longestStreak,
          lastActiveDate: bumped.lastActiveDate,
          checkinsCount,
          communityInteractionsCount,
          dailyMissions: { ...state.dailyMissions, completed: { ...state.dailyMissions.completed, [id]: true } },
          unlockedAchievements: achievementUnlock.unlockedAchievements,
          unlockedCosmetics: achievementUnlock.unlockedCosmetics,
          diamonds: state.diamonds + diamondsEarned + achievementUnlock.diamondsFromAchievements,
        });

        return {
          earned: def.reward + achievementUnlock.scoreFromAchievements,
          diamondsEarned: diamondsEarned + achievementUnlock.diamondsFromAchievements,
          newAchievements,
        };
      },

      awardAction: (action) => {
        const gain = applyEnergy(get().reviveScore, awardFor(action));
        set({
          reviveScore: gain.energy,
          lifetimeScore: gain.energy,
          level: gain.level,
          levelTitle: gain.levelTitle,
          treeStage: gain.treeStage,
        });
      },

      purchaseCosmetic: (id) => {
        const state = get();
        const item = cosmeticById(id);
        if (!item || item.diamondCost <= 0) return false;
        if (state.unlockedCosmetics.includes(id)) return false;
        if (state.diamonds < item.diamondCost) return false;
        set({
          diamonds: state.diamonds - item.diamondCost,
          unlockedCosmetics: [...state.unlockedCosmetics, id],
        });
        return true;
      },

      equipCosmetic: (category, id) => {
        const state = get();
        if (!state.unlockedCosmetics.includes(id)) return;
        set({ equippedCosmetics: { ...state.equippedCosmetics, [category]: id } });
      },

      isDailyRewardClaimed: () => get().lastRewardClaimDate === todayKey(),

      claimDailyReward: () => {
        const state = get();
        if (state.lastRewardClaimDate === todayKey()) return { earned: 0 };
        // Grows gently with the streak, capped so it stays a bonus, not the main loop.
        const earned = 10 + Math.min(state.currentStreak, 10);
        const gain = applyEnergy(state.reviveScore, earned);
        set({
          reviveScore: gain.energy,
          lifetimeScore: gain.energy,
          level: gain.level,
          levelTitle: gain.levelTitle,
          treeStage: gain.treeStage,
          lastRewardClaimDate: todayKey(),
        });
        return { earned };
      },
    }),
    {
      name: 'revive.growth.v2',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

// --- internal helpers (not exported — the store is the only caller) --------

function ensurePlaylist(
  get: () => GrowthState,
  set: (partial: Partial<GrowthState>) => void,
): void {
  const state = get();
  const today = todayKey();
  if (state.todaysPlaylist.date === today) return;

  const recentTypes = state.playlistHistory.slice(-2).flatMap((h) => h.gameTypes);
  const playlist = generateDailyPlaylist(new Date(), recentTypes);
  const history =
    state.todaysPlaylist.date && state.todaysPlaylist.games.length > 0
      ? [
          ...state.playlistHistory,
          { date: state.todaysPlaylist.date, gameTypes: state.todaysPlaylist.games.map((g) => g.gameType) },
        ].slice(-3)
      : state.playlistHistory;

  set({
    todaysPlaylist: { date: today, games: playlist.map((c) => ({ gameType: c.gameType, completed: false })) },
    playlistHistory: history,
    dailyMissions: { date: today, completed: {} },
  });
}

function bumpStreak(state: GrowthState): {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  diamondsEarned: number;
} {
  const today = todayKey();
  if (state.lastActiveDate === today) {
    return {
      currentStreak: state.currentStreak,
      longestStreak: state.longestStreak,
      lastActiveDate: state.lastActiveDate,
      diamondsEarned: 0,
    };
  }
  const currentStreak = state.lastActiveDate === yesterdayKey() ? state.currentStreak + 1 : 1;
  const longestStreak = Math.max(state.longestStreak, currentStreak);
  return {
    currentStreak,
    longestStreak,
    lastActiveDate: today,
    diamondsEarned: awardStreakMilestone(currentStreak),
  };
}

/**
 * Applies newly-unlocked achievements on top of `baseEnergy` — the score
 * AFTER the game/mission reward that triggered this check, never the
 * pre-transaction value, so score awards stack correctly in one transaction.
 */
function applyAchievements(
  baseEnergy: number,
  unlockedAchievements: AchievementId[],
  unlockedCosmetics: string[],
  achievements: AchievementDef[],
): {
  finalEnergyGain: EnergyGain;
  scoreFromAchievements: number;
  diamondsFromAchievements: number;
  unlockedAchievements: AchievementId[];
  unlockedCosmetics: string[];
} {
  if (achievements.length === 0) {
    return {
      finalEnergyGain: applyEnergy(baseEnergy, 0),
      scoreFromAchievements: 0,
      diamondsFromAchievements: 0,
      unlockedAchievements,
      unlockedCosmetics,
    };
  }
  const scoreFromAchievements = achievements.length * awardFor('achievement_unlocked');
  const diamondsFromAchievements = achievements.length * awardAchievementDiamonds();
  const badgeIds = achievements.map((a) => `badge_${a.id}`);
  return {
    finalEnergyGain: applyEnergy(baseEnergy, scoreFromAchievements),
    scoreFromAchievements,
    diamondsFromAchievements,
    unlockedAchievements: [...unlockedAchievements, ...achievements.map((a) => a.id)],
    unlockedCosmetics: [...new Set([...unlockedCosmetics, ...badgeIds])],
  };
}

// Re-export mission list so components don't need a second import.
export { DAILY_MISSIONS };
