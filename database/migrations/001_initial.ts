import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Initial schema. Mirrors the Supabase tables so rows can sync 1:1.
 * All synced tables carry: id, created_at, updated_at, sync_status (and
 * deleted_at where soft-delete applies). JSON columns are TEXT here / jsonb
 * in Supabase.
 */
export async function up(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    -- 1. Recovery profile (one row per user).
    CREATE TABLE IF NOT EXISTS profiles (
      id                        TEXT PRIMARY KEY NOT NULL,
      supabase_id               TEXT,
      display_name              TEXT,
      age_range                 TEXT,
      primary_goal              TEXT,
      goals                     TEXT,            -- JSON array
      triggers                  TEXT,            -- JSON array
      life_impacts              TEXT,            -- JSON array
      support_preferences       TEXT,            -- JSON array
      daily_commitment_minutes  INTEGER,
      recovery_start_date       TEXT,            -- ISO date
      longest_streak            INTEGER NOT NULL DEFAULT 0,
      current_stage             TEXT,            -- Awareness|Control|Rebuilding|Growth
      notification_enabled      INTEGER NOT NULL DEFAULT 1,
      created_at                TEXT NOT NULL,
      updated_at                TEXT NOT NULL,
      sync_status               TEXT NOT NULL DEFAULT 'pending'
    );

    -- 2. Daily emotional check-ins (one per user per day).
    CREATE TABLE IF NOT EXISTS daily_checkins (
      id                   TEXT PRIMARY KEY NOT NULL,
      user_id              TEXT NOT NULL,
      date                 TEXT NOT NULL,        -- YYYY-MM-DD
      mood                 TEXT,                 -- heavy|normal|positive|struggling
      urge_level           INTEGER,              -- 1..5
      triggers             TEXT,                 -- JSON array
      reflection_note      TEXT,
      completed_exercises  TEXT,                 -- JSON array
      created_at           TEXT NOT NULL,
      updated_at           TEXT NOT NULL,
      sync_status          TEXT NOT NULL DEFAULT 'pending'
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_checkins_user_date
      ON daily_checkins (user_id, date);

    -- 3. Private journal. Sensitive: content flows through an encryption seam
    --    (services/crypto.ts) so it can be encrypted at rest later without a
    --    schema change. Soft-deleted via deleted_at.
    CREATE TABLE IF NOT EXISTS journal_entries (
      id           TEXT PRIMARY KEY NOT NULL,
      user_id      TEXT NOT NULL,
      title        TEXT,
      content      TEXT NOT NULL,
      emotion      TEXT,
      created_at   TEXT NOT NULL,
      updated_at   TEXT NOT NULL,
      sync_status  TEXT NOT NULL DEFAULT 'pending',
      deleted_at   TEXT
    );

    -- 4. Recovery timeline events (append-only milestones/exercises/etc).
    CREATE TABLE IF NOT EXISTS recovery_events (
      id           TEXT PRIMARY KEY NOT NULL,
      user_id      TEXT NOT NULL,
      event_type   TEXT NOT NULL,                -- milestone|exercise|urge_controlled|checkin
      metadata     TEXT,                         -- JSON object
      event_date   TEXT NOT NULL,
      created_at   TEXT NOT NULL,
      updated_at   TEXT NOT NULL,
      sync_status  TEXT NOT NULL DEFAULT 'pending'
    );
    CREATE INDEX IF NOT EXISTS idx_events_user_date
      ON recovery_events (user_id, event_date);

    -- 5. Personalized trigger patterns (drives coach + insights).
    CREATE TABLE IF NOT EXISTS user_triggers (
      id             TEXT PRIMARY KEY NOT NULL,
      user_id        TEXT NOT NULL,
      trigger_type   TEXT NOT NULL,              -- stress|loneliness|night|...
      frequency      INTEGER NOT NULL DEFAULT 0,
      last_occurred  TEXT,
      created_at     TEXT NOT NULL,
      updated_at     TEXT NOT NULL,
      sync_status    TEXT NOT NULL DEFAULT 'pending'
    );

    -- 6. AI coach memory — summaries ONLY, never raw conversations.
    CREATE TABLE IF NOT EXISTS coach_memory (
      id                  TEXT PRIMARY KEY NOT NULL,
      user_id             TEXT NOT NULL,
      summary             TEXT NOT NULL,
      important_patterns  TEXT,                  -- JSON object
      created_at          TEXT NOT NULL,
      updated_at          TEXT NOT NULL,
      sync_status         TEXT NOT NULL DEFAULT 'pending'
    );

    -- 7. Offline sync queue — local only, drives push order.
    CREATE TABLE IF NOT EXISTS sync_queue (
      id           TEXT PRIMARY KEY NOT NULL,
      table_name   TEXT NOT NULL,
      record_id    TEXT NOT NULL,
      operation    TEXT NOT NULL,                -- insert|update|delete
      created_at   TEXT NOT NULL,
      retry_count  INTEGER NOT NULL DEFAULT 0,
      last_error   TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_queue_created ON sync_queue (created_at);

    -- Local key/value for sync bookkeeping (e.g. last pull timestamps).
    CREATE TABLE IF NOT EXISTS sync_meta (
      key    TEXT PRIMARY KEY NOT NULL,
      value  TEXT
    );
  `);
}
