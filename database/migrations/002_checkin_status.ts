import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Adds the garden day-status to check-ins so the Journey Calendar reflects real
 * data: each day is 'growth' or a 'storm' the user weathered. Storms never
 * reset progress — this is recorded as weather, not failure.
 */
export async function up(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    ALTER TABLE daily_checkins ADD COLUMN day_status TEXT NOT NULL DEFAULT 'growth';
    ALTER TABLE daily_checkins ADD COLUMN weathered_storm INTEGER NOT NULL DEFAULT 0;
  `);
}
