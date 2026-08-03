import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * The Recovery Check-In table. Named `recovery_checkins` (not `daily_checkins`)
 * deliberately — 001_initial.ts already defines a `daily_checkins` table for
 * the earlier mood-based check-in feature, with a different shape (mood,
 * day_status, reflection_note…). Reusing that name here would silently clash
 * two different schemas under one table. This is a distinct, newer feature.
 *
 * PREPARED BUT UNWIRED: the app runs on Zustand + AsyncStorage today (see
 * stores/recoveryStore.ts) to keep loading reliably in Expo Go. This defines
 * the shape the local-first backend will use once reconnected.
 */
export async function up(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS recovery_checkins (
      id             TEXT PRIMARY KEY NOT NULL,
      user_id        TEXT NOT NULL,
      date           TEXT NOT NULL,        -- YYYY-MM-DD
      status         TEXT NOT NULL,        -- success | urge | relapse
      relapse_count  INTEGER NOT NULL DEFAULT 0,
      urge_level     INTEGER,              -- 1..5, only for 'urge'
      trigger        TEXT,                 -- only optionally for 'relapse'
      created_at     TEXT NOT NULL,
      synced         INTEGER NOT NULL DEFAULT 0
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_recovery_checkins_user_date
      ON recovery_checkins (user_id, date);
  `);
}
