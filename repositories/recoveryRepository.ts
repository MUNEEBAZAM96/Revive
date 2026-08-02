import {
  CoachMemory,
  RecoveryEvent,
  RecoveryEventType,
  RecoveryStage,
  TABLES,
  UserTrigger,
} from '@/database/schema';

import {
  decodeJsonObject,
  encodeJson,
  getRows,
  insertRow,
  newId,
  updateRow,
} from './baseRepository';
import { checkinRepository } from './checkinRepository';
import { profileRepository } from './profileRepository';

/**
 * Aggregates the recovery timeline, trigger patterns, and coach memory, and
 * assembles everything the Dashboard needs in a single call. This is the
 * repository the Dashboard screen talks to (DashboardScreen -> RecoveryRepository).
 */

// --- recovery_events -------------------------------------------------------

function mapEvent(row: Record<string, unknown>): RecoveryEvent {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    event_type: row.event_type as RecoveryEventType,
    metadata: decodeJsonObject(row.metadata),
    event_date: String(row.event_date),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    sync_status: row.sync_status as RecoveryEvent['sync_status'],
  };
}

// --- user_triggers ---------------------------------------------------------

function mapTrigger(row: Record<string, unknown>): UserTrigger {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    trigger_type: String(row.trigger_type),
    frequency: (row.frequency as number) ?? 0,
    last_occurred: (row.last_occurred as string) ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    sync_status: row.sync_status as UserTrigger['sync_status'],
  };
}

// --- coach_memory ----------------------------------------------------------

function mapMemory(row: Record<string, unknown>): CoachMemory {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    summary: String(row.summary),
    important_patterns: decodeJsonObject(row.important_patterns),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    sync_status: row.sync_status as CoachMemory['sync_status'],
  };
}

function daysSince(isoDate: string | null): number {
  if (!isoDate) return 0;
  const start = new Date(isoDate).getTime();
  if (Number.isNaN(start)) return 0;
  const diff = Date.now() - start;
  return Math.max(0, Math.floor(diff / 86_400_000));
}

/** Focus copy for "Today's Journey", derived from the user's recovery stage. */
const STAGE_FOCUS: Record<RecoveryStage, string> = {
  Awareness: 'Understanding Your Triggers',
  Control: 'Building Self-Control',
  Rebuilding: 'Rebuilding Confidence',
  Growth: 'Sustaining Your Growth',
};

export interface DashboardData {
  recoveryDays: number;
  longestStreak: number;
  currentStage: RecoveryStage | null;
  primaryGoal: string | null;
  /** Whether the user has already checked in today (drives the water nudge). */
  checkedInToday: boolean;
  /** Copy for the Daily Focus card. */
  todayFocus: string;
  /** Mature trees earned so far — one per 30 days grown. */
  forestTrees: number;
  topTriggers: { trigger_type: string; frequency: number }[];
  coachSuggestion: string | null;
}

export const recoveryRepository = {
  async addEvent(
    userId: string,
    eventType: RecoveryEventType,
    metadata: Record<string, unknown> = {},
    eventDate: string = new Date().toISOString().slice(0, 10),
  ): Promise<void> {
    await insertRow(TABLES.recovery_events, newId(), {
      user_id: userId,
      event_type: eventType,
      metadata: encodeJson(metadata),
      event_date: eventDate,
    });
  },

  async getTimeline(userId: string, limit = 50): Promise<RecoveryEvent[]> {
    const rows = await getRows<Record<string, unknown>>(
      TABLES.recovery_events,
      'user_id = ?',
      [userId],
      `event_date DESC LIMIT ${Math.floor(limit)}`,
    );
    return rows.map(mapEvent);
  },

  /** Increment a trigger's frequency, or create it on first occurrence. */
  async recordTrigger(userId: string, triggerType: string): Promise<void> {
    const rows = await getRows<Record<string, unknown>>(
      TABLES.user_triggers,
      'user_id = ? AND trigger_type = ?',
      [userId, triggerType],
    );
    const now = new Date().toISOString();
    if (rows[0]) {
      const existing = mapTrigger(rows[0]);
      await updateRow(TABLES.user_triggers, existing.id, {
        frequency: existing.frequency + 1,
        last_occurred: now,
      });
      return;
    }
    await insertRow(TABLES.user_triggers, newId(), {
      user_id: userId,
      trigger_type: triggerType,
      frequency: 1,
      last_occurred: now,
    });
  },

  async getTopTriggers(userId: string, limit = 5): Promise<UserTrigger[]> {
    const rows = await getRows<Record<string, unknown>>(
      TABLES.user_triggers,
      'user_id = ?',
      [userId],
      `frequency DESC LIMIT ${Math.floor(limit)}`,
    );
    return rows.map(mapTrigger);
  },

  async getCoachMemory(userId: string): Promise<CoachMemory | null> {
    const rows = await getRows<Record<string, unknown>>(
      TABLES.coach_memory,
      'user_id = ?',
      [userId],
      'updated_at DESC LIMIT 1',
    );
    return rows[0] ? mapMemory(rows[0]) : null;
  },

  async saveCoachMemory(
    userId: string,
    summary: string,
    patterns: Record<string, unknown> = {},
  ): Promise<void> {
    const existing = await this.getCoachMemory(userId);
    if (existing) {
      await updateRow(TABLES.coach_memory, existing.id, {
        summary,
        important_patterns: encodeJson(patterns),
      });
      return;
    }
    await insertRow(TABLES.coach_memory, newId(), {
      user_id: userId,
      summary,
      important_patterns: encodeJson(patterns),
    });
  },

  /**
   * Everything the Dashboard renders, assembled from the repositories. Keeps
   * the screen ignorant of SQLite: it asks for `DashboardData` and gets it.
   */
  async getDashboardData(userId: string): Promise<DashboardData> {
    const today = new Date().toISOString().slice(0, 10);
    const [profile, todayCheckin, triggers, memory] = await Promise.all([
      profileRepository.get(userId),
      checkinRepository.getByDate(userId, today),
      this.getTopTriggers(userId, 5),
      this.getCoachMemory(userId),
    ]);

    const recoveryDays = daysSince(profile?.recovery_start_date ?? null);
    const stage = profile?.current_stage ?? null;

    return {
      recoveryDays,
      longestStreak: profile?.longest_streak ?? 0,
      currentStage: stage,
      primaryGoal: profile?.primary_goal ?? null,
      checkedInToday: todayCheckin !== null,
      todayFocus: stage ? STAGE_FOCUS[stage] : 'Building Self-Control',
      forestTrees: Math.floor(recoveryDays / 30),
      topTriggers: triggers.map((t) => ({
        trigger_type: t.trigger_type,
        frequency: t.frequency,
      })),
      coachSuggestion: memory?.summary ?? null,
    };
  },
};
