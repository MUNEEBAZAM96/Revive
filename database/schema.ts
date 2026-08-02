/**
 * Single source of truth for the local-first data model.
 *
 * Design notes:
 * - Column names are snake_case and IDENTICAL between SQLite and Supabase so
 *   the sync engine can move rows without a field-mapping table.
 * - JSON-shaped columns (arrays/objects) are stored as TEXT in SQLite and as
 *   jsonb in Supabase. The sync layer parses/stringifies using `SYNC_TABLES`.
 * - The spec's global rule ("every synced table needs id/created_at/updated_at/
 *   sync_status") wins over the per-table lists: we add `updated_at` to every
 *   synced table (recovery_events, user_triggers included) because
 *   last-updated-wins conflict resolution requires it.
 */

export type SyncStatus = 'pending' | 'synced' | 'failed';
export type SyncOperation = 'insert' | 'update' | 'delete';

export type RecoveryStage = 'Awareness' | 'Control' | 'Rebuilding' | 'Growth';
export type Mood = 'heavy' | 'normal' | 'positive' | 'struggling';
export type RecoveryEventType = 'milestone' | 'exercise' | 'urge_controlled' | 'checkin';
/** How a day counted toward the garden: growth, or a storm the user weathered. */
export type DayStatus = 'growth' | 'storm';

/** Local-only tables that never sync to the cloud. */
export const TABLES = {
  profiles: 'profiles',
  daily_checkins: 'daily_checkins',
  journal_entries: 'journal_entries',
  recovery_events: 'recovery_events',
  user_triggers: 'user_triggers',
  coach_memory: 'coach_memory',
  sync_queue: 'sync_queue',
  sync_meta: 'sync_meta',
} as const;

export type TableName = (typeof TABLES)[keyof typeof TABLES];

/**
 * Metadata that drives the generic sync engine. `json` columns are
 * parsed/stringified across the SQLite<->Supabase boundary; `bool` columns are
 * converted between SQLite's 0/1 and Postgres booleans; `softDelete` tables use
 * a `deleted_at` tombstone instead of a hard delete.
 */
export const SYNC_TABLES = [
  {
    name: TABLES.profiles,
    json: ['goals', 'triggers', 'life_impacts', 'support_preferences'],
    bool: ['notification_enabled'],
    softDelete: false,
  },
  {
    name: TABLES.daily_checkins,
    json: ['triggers', 'completed_exercises'],
    bool: ['weathered_storm'],
    softDelete: false,
  },
  {
    name: TABLES.journal_entries,
    json: [],
    bool: [],
    softDelete: true,
  },
  {
    name: TABLES.recovery_events,
    json: ['metadata'],
    bool: [],
    softDelete: false,
  },
  {
    name: TABLES.user_triggers,
    json: [],
    bool: [],
    softDelete: false,
  },
  {
    name: TABLES.coach_memory,
    json: ['important_patterns'],
    bool: [],
    softDelete: false,
  },
] as const;

export type SyncTableMeta = (typeof SYNC_TABLES)[number];
export type SyncableTableName = SyncTableMeta['name'];

// ---------------------------------------------------------------------------
// Domain types — what repositories accept and return (JSON already parsed).
// ---------------------------------------------------------------------------

export interface Profile {
  id: string;
  supabase_id: string | null;
  display_name: string | null;
  age_range: string | null;
  primary_goal: string | null;
  goals: string[];
  triggers: string[];
  life_impacts: string[];
  support_preferences: string[];
  daily_commitment_minutes: number | null;
  recovery_start_date: string | null;
  longest_streak: number;
  current_stage: RecoveryStage | null;
  notification_enabled: boolean;
  created_at: string;
  updated_at: string;
  sync_status: SyncStatus;
}

export interface DailyCheckin {
  id: string;
  user_id: string;
  date: string;
  mood: Mood | null;
  urge_level: number | null;
  triggers: string[];
  reflection_note: string | null;
  completed_exercises: string[];
  day_status: DayStatus;
  weathered_storm: boolean;
  created_at: string;
  updated_at: string;
  sync_status: SyncStatus;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  title: string | null;
  content: string;
  emotion: string | null;
  created_at: string;
  updated_at: string;
  sync_status: SyncStatus;
  deleted_at: string | null;
}

export interface RecoveryEvent {
  id: string;
  user_id: string;
  event_type: RecoveryEventType;
  metadata: Record<string, unknown>;
  event_date: string;
  created_at: string;
  updated_at: string;
  sync_status: SyncStatus;
}

export interface UserTrigger {
  id: string;
  user_id: string;
  trigger_type: string;
  frequency: number;
  last_occurred: string | null;
  created_at: string;
  updated_at: string;
  sync_status: SyncStatus;
}

export interface CoachMemory {
  id: string;
  user_id: string;
  summary: string;
  important_patterns: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  sync_status: SyncStatus;
}

export interface SyncQueueItem {
  id: string;
  table_name: SyncableTableName;
  record_id: string;
  operation: SyncOperation;
  created_at: string;
  retry_count: number;
  last_error: string | null;
}
