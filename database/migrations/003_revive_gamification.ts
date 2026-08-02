import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Gamification tables for Revive 2.0 (Revive Score, Diamonds, daily playlist,
 * missions, achievements, calendar, journey timeline).
 *
 * PREPARED BUT UNWIRED: the app currently runs on Zustand + AsyncStorage
 * (see stores/growthStore.ts) so it keeps loading reliably in Expo Go. This
 * migration defines the shape the local-first backend will use once it's
 * reconnected — column names mirror the store's fields so the eventual sync
 * mapping is mechanical. `journal_entries` (001_initial) is left as-is and
 * unused now that the Journal feature is removed from the app; dropping an
 * already-inert table isn't necessary for that removal.
 */
export async function up(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    -- 1. Growth profile: one row per user (score, diamonds, level, streak).
    CREATE TABLE IF NOT EXISTS growth (
      id                     TEXT PRIMARY KEY NOT NULL,
      user_id                TEXT NOT NULL,
      revive_score           INTEGER NOT NULL DEFAULT 0,
      lifetime_score         INTEGER NOT NULL DEFAULT 0,
      diamonds               INTEGER NOT NULL DEFAULT 0,
      level                  INTEGER NOT NULL DEFAULT 1,
      level_title            TEXT NOT NULL DEFAULT 'beginning',
      tree_stage             TEXT NOT NULL DEFAULT 'stage_1_seed',
      current_streak         INTEGER NOT NULL DEFAULT 0,
      longest_streak         INTEGER NOT NULL DEFAULT 0,
      last_active_date       TEXT,
      lifetime_games_completed INTEGER NOT NULL DEFAULT 0,
      checkins_count         INTEGER NOT NULL DEFAULT 0,
      community_interactions_count INTEGER NOT NULL DEFAULT 0,
      equipped_garden_theme  TEXT NOT NULL DEFAULT 'garden_default',
      equipped_profile_frame TEXT NOT NULL DEFAULT 'frame_none',
      equipped_app_theme     TEXT NOT NULL DEFAULT 'theme_default',
      created_at             TEXT NOT NULL,
      updated_at             TEXT NOT NULL,
      sync_status            TEXT NOT NULL DEFAULT 'pending'
    );

    -- 2. Static game catalog (reference data — the 10 mind-training games).
    CREATE TABLE IF NOT EXISTS games (
      id             TEXT PRIMARY KEY NOT NULL,  -- GameType, e.g. 'word_builder'
      title          TEXT NOT NULL,
      category       TEXT NOT NULL,
      base_reward    INTEGER NOT NULL,
      base_duration_minutes INTEGER NOT NULL
    );

    -- 3. Per-play history (drives lifetime stats + achievements).
    CREATE TABLE IF NOT EXISTS game_history (
      id            TEXT PRIMARY KEY NOT NULL,
      user_id       TEXT NOT NULL,
      game_type     TEXT NOT NULL,
      difficulty    TEXT NOT NULL,               -- easy|medium|hard
      score         INTEGER NOT NULL,
      reward        INTEGER NOT NULL,
      duration_sec  INTEGER NOT NULL,
      completed_at  TEXT NOT NULL,
      created_at    TEXT NOT NULL,
      updated_at    TEXT NOT NULL,
      sync_status   TEXT NOT NULL DEFAULT 'pending'
    );
    CREATE INDEX IF NOT EXISTS idx_game_history_user_date
      ON game_history (user_id, completed_at);

    -- 4. Daily mission completion, one row per user per day.
    CREATE TABLE IF NOT EXISTS daily_missions (
      id           TEXT PRIMARY KEY NOT NULL,
      user_id      TEXT NOT NULL,
      date         TEXT NOT NULL,
      mission_id   TEXT NOT NULL,                -- MissionId
      completed_at TEXT NOT NULL,
      created_at   TEXT NOT NULL,
      updated_at   TEXT NOT NULL,
      sync_status  TEXT NOT NULL DEFAULT 'pending'
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_missions_unique
      ON daily_missions (user_id, date, mission_id);

    -- 5. Unlocked achievements.
    CREATE TABLE IF NOT EXISTS achievements (
      id              TEXT PRIMARY KEY NOT NULL,
      user_id         TEXT NOT NULL,
      achievement_id  TEXT NOT NULL,              -- AchievementId
      unlocked_at     TEXT NOT NULL,
      created_at      TEXT NOT NULL,
      updated_at      TEXT NOT NULL,
      sync_status     TEXT NOT NULL DEFAULT 'pending'
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_achievements_unique
      ON achievements (user_id, achievement_id);

    -- 6. Calendar roll-up: one row per user per day, powering the Recovery
    --    Calendar in the Journey tab.
    CREATE TABLE IF NOT EXISTS calendar (
      id                  TEXT PRIMARY KEY NOT NULL,
      user_id             TEXT NOT NULL,
      date                TEXT NOT NULL,
      games_completed     INTEGER NOT NULL DEFAULT 0,
      missions_completed  INTEGER NOT NULL DEFAULT 0,
      checked_in          INTEGER NOT NULL DEFAULT 0,
      breathing_done      INTEGER NOT NULL DEFAULT 0,
      day_status          TEXT NOT NULL DEFAULT 'growth',
      created_at          TEXT NOT NULL,
      updated_at          TEXT NOT NULL,
      sync_status         TEXT NOT NULL DEFAULT 'pending'
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_calendar_unique ON calendar (user_id, date);

    -- 7. Recovery timeline events (Started Revive, Reached Level 5, …).
    CREATE TABLE IF NOT EXISTS journey (
      id           TEXT PRIMARY KEY NOT NULL,
      user_id      TEXT NOT NULL,
      event_type   TEXT NOT NULL,
      label        TEXT NOT NULL,
      metadata     TEXT,                          -- JSON object
      event_date   TEXT NOT NULL,
      created_at   TEXT NOT NULL,
      updated_at   TEXT NOT NULL,
      sync_status  TEXT NOT NULL DEFAULT 'pending'
    );
    CREATE INDEX IF NOT EXISTS idx_journey_user_date ON journey (user_id, event_date);
  `);
}
