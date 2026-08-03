import { getDb, newId } from './sqlite';
import type { CheckInStatus, RecoveryCheckIn, TriggerType } from '@/services/checkInService';

/**
 * SQLite-facing repository for `recovery_checkins` (see
 * migrations/004_recovery_checkins.ts). PREPARED BUT UNWIRED — the running
 * app persists check-ins via stores/recoveryStore.ts (Zustand + AsyncStorage)
 * instead, to keep Expo Go loading reliably. This repository is ready to
 * swap in as that store's persistence layer once the local-first backend is
 * reconnected; its method shapes intentionally mirror what the store needs
 * (upsert-by-date, list-by-range) so that swap is mechanical.
 */

type RawCheckIn = {
  id: string;
  user_id: string;
  date: string;
  status: string;
  relapse_count: number;
  urge_level: number | null;
  trigger: string | null;
  created_at: string;
  synced: number;
};

function mapRow(row: RawCheckIn): RecoveryCheckIn {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    status: row.status as CheckInStatus,
    relapseCount: row.relapse_count,
    urgeLevel: row.urge_level,
    trigger: row.trigger as TriggerType | null,
    createdAt: row.created_at,
    synced: row.synced === 1,
  };
}

export const checkInRepository = {
  async getByDate(userId: string, date: string): Promise<RecoveryCheckIn | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<RawCheckIn>(
      'SELECT * FROM recovery_checkins WHERE user_id = ? AND date = ?',
      [userId, date],
    );
    return row ? mapRow(row) : null;
  },

  /** One row per user per day — inserting for an existing date replaces it. */
  async upsert(checkIn: RecoveryCheckIn): Promise<void> {
    const db = await getDb();
    const existing = await this.getByDate(checkIn.userId, checkIn.date);
    const id = existing?.id ?? checkIn.id ?? newId();

    await db.runAsync(
      `INSERT INTO recovery_checkins
        (id, user_id, date, status, relapse_count, urge_level, trigger, created_at, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, date) DO UPDATE SET
         status = excluded.status,
         relapse_count = excluded.relapse_count,
         urge_level = excluded.urge_level,
         trigger = excluded.trigger,
         synced = excluded.synced`,
      [
        id,
        checkIn.userId,
        checkIn.date,
        checkIn.status,
        checkIn.relapseCount,
        checkIn.urgeLevel,
        checkIn.trigger,
        checkIn.createdAt,
        checkIn.synced ? 1 : 0,
      ],
    );
  },

  async getRange(userId: string, fromDate: string, toDate: string): Promise<RecoveryCheckIn[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<RawCheckIn>(
      'SELECT * FROM recovery_checkins WHERE user_id = ? AND date >= ? AND date <= ? ORDER BY date ASC',
      [userId, fromDate, toDate],
    );
    return rows.map(mapRow);
  },

  async getUnsynced(userId: string): Promise<RecoveryCheckIn[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<RawCheckIn>(
      'SELECT * FROM recovery_checkins WHERE user_id = ? AND synced = 0',
      [userId],
    );
    return rows.map(mapRow);
  },

  async markSynced(id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('UPDATE recovery_checkins SET synced = 1 WHERE id = ?', [id]);
  },
};
