import { DailyCheckin, DayStatus, Mood, TABLES } from '@/database/schema';

import {
  ColumnMap,
  decodeJsonArray,
  encodeJson,
  fromBool,
  getRows,
  insertRow,
  newId,
  toBool,
  updateRow,
} from './baseRepository';

type RawCheckin = Record<string, unknown>;

function mapCheckin(row: RawCheckin): DailyCheckin {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    date: String(row.date),
    mood: (row.mood as Mood) ?? null,
    urge_level: (row.urge_level as number) ?? null,
    triggers: decodeJsonArray(row.triggers),
    reflection_note: (row.reflection_note as string) ?? null,
    completed_exercises: decodeJsonArray(row.completed_exercises),
    day_status: (row.day_status as DayStatus) ?? 'growth',
    weathered_storm: toBool(row.weathered_storm),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    sync_status: row.sync_status as DailyCheckin['sync_status'],
  };
}

export interface CheckinInput {
  mood?: Mood | null;
  urge_level?: number | null;
  triggers?: string[];
  reflection_note?: string | null;
  completed_exercises?: string[];
  day_status?: DayStatus;
  weathered_storm?: boolean;
}

function toColumns(input: CheckinInput): ColumnMap {
  const c: ColumnMap = {};
  if (input.mood !== undefined) c.mood = input.mood;
  if (input.urge_level !== undefined) c.urge_level = input.urge_level;
  if (input.triggers !== undefined) c.triggers = encodeJson(input.triggers);
  if (input.reflection_note !== undefined) c.reflection_note = input.reflection_note;
  if (input.completed_exercises !== undefined) {
    c.completed_exercises = encodeJson(input.completed_exercises);
  }
  if (input.day_status !== undefined) c.day_status = input.day_status;
  if (input.weathered_storm !== undefined) c.weathered_storm = fromBool(input.weathered_storm);
  return c;
}

const today = () => new Date().toISOString().slice(0, 10);

export const checkinRepository = {
  async getByDate(userId: string, date: string): Promise<DailyCheckin | null> {
    const rows = await getRows<RawCheckin>(
      TABLES.daily_checkins,
      'user_id = ? AND date = ?',
      [userId, date],
    );
    return rows[0] ? mapCheckin(rows[0]) : null;
  },

  /** Insert or update the single check-in for a given day (default: today). */
  async upsertForDate(
    userId: string,
    input: CheckinInput,
    date: string = today(),
  ): Promise<void> {
    const existing = await this.getByDate(userId, date);
    if (existing) {
      await updateRow(TABLES.daily_checkins, existing.id, toColumns(input));
      return;
    }
    await insertRow(TABLES.daily_checkins, newId(), {
      user_id: userId,
      date,
      ...toColumns(input),
    });
  },

  async getForMonth(userId: string, year: number, month: number): Promise<DailyCheckin[]> {
    // month is 0-based to match JS Date; convert to a YYYY-MM prefix.
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    const rows = await getRows<RawCheckin>(
      TABLES.daily_checkins,
      "user_id = ? AND date LIKE ?",
      [userId, `${prefix}-%`],
      'date ASC',
    );
    return rows.map(mapCheckin);
  },

  async getRecent(userId: string, limit = 30): Promise<DailyCheckin[]> {
    const rows = await getRows<RawCheckin>(
      TABLES.daily_checkins,
      'user_id = ?',
      [userId],
      `date DESC LIMIT ${Math.max(1, Math.floor(limit))}`,
    );
    return rows.map(mapCheckin);
  },
};
