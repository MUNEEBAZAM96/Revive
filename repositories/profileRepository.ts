import { Profile, RecoveryStage, TABLES } from '@/database/schema';

import {
  ColumnMap,
  decodeJsonArray,
  encodeJson,
  fromBool,
  getById,
  insertRow,
  newId,
  toBool,
  updateRow,
} from './baseRepository';

/**
 * Recovery profile access. The profile row's `id` IS the auth user id, which
 * keeps it 1:1 with Supabase's `profiles.id references auth.users`.
 */

type RawProfile = Record<string, unknown>;

function mapProfile(row: RawProfile): Profile {
  return {
    id: String(row.id),
    supabase_id: (row.supabase_id as string) ?? null,
    display_name: (row.display_name as string) ?? null,
    age_range: (row.age_range as string) ?? null,
    primary_goal: (row.primary_goal as string) ?? null,
    goals: decodeJsonArray(row.goals),
    triggers: decodeJsonArray(row.triggers),
    life_impacts: decodeJsonArray(row.life_impacts),
    support_preferences: decodeJsonArray(row.support_preferences),
    daily_commitment_minutes: (row.daily_commitment_minutes as number) ?? null,
    recovery_start_date: (row.recovery_start_date as string) ?? null,
    longest_streak: (row.longest_streak as number) ?? 0,
    current_stage: (row.current_stage as RecoveryStage) ?? null,
    notification_enabled: toBool(row.notification_enabled),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    sync_status: row.sync_status as Profile['sync_status'],
  };
}

function toColumns(patch: Partial<Profile>): ColumnMap {
  const c: ColumnMap = {};
  if (patch.supabase_id !== undefined) c.supabase_id = patch.supabase_id;
  if (patch.display_name !== undefined) c.display_name = patch.display_name;
  if (patch.age_range !== undefined) c.age_range = patch.age_range;
  if (patch.primary_goal !== undefined) c.primary_goal = patch.primary_goal;
  if (patch.goals !== undefined) c.goals = encodeJson(patch.goals);
  if (patch.triggers !== undefined) c.triggers = encodeJson(patch.triggers);
  if (patch.life_impacts !== undefined) c.life_impacts = encodeJson(patch.life_impacts);
  if (patch.support_preferences !== undefined) {
    c.support_preferences = encodeJson(patch.support_preferences);
  }
  if (patch.daily_commitment_minutes !== undefined) {
    c.daily_commitment_minutes = patch.daily_commitment_minutes;
  }
  if (patch.recovery_start_date !== undefined) c.recovery_start_date = patch.recovery_start_date;
  if (patch.longest_streak !== undefined) c.longest_streak = patch.longest_streak;
  if (patch.current_stage !== undefined) c.current_stage = patch.current_stage;
  if (patch.notification_enabled !== undefined) {
    c.notification_enabled = fromBool(patch.notification_enabled);
  }
  return c;
}

export const profileRepository = {
  async get(userId: string): Promise<Profile | null> {
    const row = await getById<RawProfile>(TABLES.profiles, userId);
    return row ? mapProfile(row) : null;
  },

  /** Creates the profile row if missing (called right after auth signup). */
  async ensureProfile(userId: string, patch: Partial<Profile> = {}): Promise<Profile> {
    const existing = await this.get(userId);
    if (existing) return existing;

    const defaults: Partial<Profile> = {
      supabase_id: userId,
      goals: [],
      triggers: [],
      life_impacts: [],
      support_preferences: [],
      recovery_start_date: new Date().toISOString().slice(0, 10),
      longest_streak: 0,
      current_stage: 'Awareness',
      notification_enabled: true,
      ...patch,
    };
    await insertRow(TABLES.profiles, userId, toColumns(defaults));
    const created = await this.get(userId);
    if (!created) throw new Error('Failed to create profile');
    return created;
  },

  async update(userId: string, patch: Partial<Profile>): Promise<void> {
    await updateRow(TABLES.profiles, userId, toColumns(patch));
  },

  /** Persist the answers gathered during onboarding. */
  async saveOnboarding(
    userId: string,
    answers: {
      ageRange?: string | null;
      focusAreas?: string[];
      primaryGoal?: string | null;
      triggers?: string[];
      lifeImpact?: string[];
      supportPreference?: string | null;
      dailyCommitment?: string | null;
    },
  ): Promise<void> {
    await this.ensureProfile(userId);
    const minutes = answers.dailyCommitment
      ? Number.parseInt(answers.dailyCommitment, 10) || null
      : undefined;
    await this.update(userId, {
      age_range: answers.ageRange ?? undefined,
      primary_goal: answers.primaryGoal ?? undefined,
      goals: answers.focusAreas,
      triggers: answers.triggers,
      life_impacts: answers.lifeImpact,
      support_preferences: answers.supportPreference ? [answers.supportPreference] : undefined,
      daily_commitment_minutes: minutes,
    });
  },
};

export { newId };
