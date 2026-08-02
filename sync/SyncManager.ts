import NetInfo from '@react-native-community/netinfo';

import { getDb, getMeta, setMeta, SqlParam } from '@/database/sqlite';
import { SYNC_TABLES, SyncableTableName, SyncTableMeta } from '@/database/schema';
import { setSyncStatus } from '@/repositories/baseRepository';
import { supabase } from '@/services/supabase';

import { resolveByUpdatedAt } from './conflictResolver';
import {
  getQueueItems,
  markQueueFailure,
  removeQueueItem,
} from './syncQueue';

/**
 * SyncManager — the only component that talks to Supabase for data.
 *
 * Responsibilities:
 *   1. Detect connectivity (NetInfo) and sync on reconnect.
 *   2. Push pending local mutations from the sync queue.
 *   3. Pull remote changes updated since the last pull.
 *   4. Resolve conflicts (last-updated-wins) and mark rows synced.
 *
 * Local-first guarantee: the app is fully usable with no session and no
 * network. Cloud sync only runs when BOTH a Supabase session exists (so RLS
 * can scope rows to the user) and the device is online.
 */

const MAX_RETRIES = 5;
const EPOCH = '1970-01-01T00:00:00.000Z';

let syncing = false;
let unsubscribeNet: (() => void) | null = null;

function metaFor(name: SyncableTableName): SyncTableMeta {
  const meta = SYNC_TABLES.find((t) => t.name === name);
  if (!meta) throw new Error(`Unknown sync table: ${name}`);
  return meta;
}

async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return Boolean(state.isConnected && state.isInternetReachable !== false);
}

function safeParse(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/** Local SQLite row -> Supabase payload (parse JSON text, ints -> booleans). */
function toRemotePayload(
  meta: SyncTableMeta,
  row: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...row };
  delete out.sync_status; // local-only bookkeeping column
  for (const col of meta.json) out[col] = safeParse(out[col]);
  for (const col of meta.bool) out[col] = out[col] === 1 || out[col] === true;
  return out;
}

/** Supabase row -> local column map (stringify JSON, booleans -> ints). */
function toLocalColumns(
  meta: SyncTableMeta,
  row: Record<string, unknown>,
): Record<string, SqlParam> {
  const out: Record<string, SqlParam> = {};
  for (const [key, value] of Object.entries(row)) {
    if (value === null || value === undefined) {
      out[key] = null;
    } else if (meta.json.includes(key as never)) {
      out[key] = JSON.stringify(value);
    } else if (meta.bool.includes(key as never)) {
      out[key] = value ? 1 : 0;
    } else if (typeof value === 'boolean') {
      out[key] = value ? 1 : 0;
    } else if (typeof value === 'object') {
      out[key] = JSON.stringify(value);
    } else {
      out[key] = value as SqlParam;
    }
  }
  out.sync_status = 'synced';
  return out;
}

// --- push ------------------------------------------------------------------

async function pushOne(item: Awaited<ReturnType<typeof getQueueItems>>[number]): Promise<void> {
  const meta = metaFor(item.table_name);
  const db = await getDb();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    `SELECT * FROM ${item.table_name} WHERE id = ?`,
    [item.record_id],
  );

  // Row vanished locally — nothing to push.
  if (!row) {
    await removeQueueItem(item.id);
    return;
  }

  if (item.operation === 'delete' && !meta.softDelete) {
    const { error } = await supabase.from(item.table_name).delete().eq('id', item.record_id);
    if (error) throw new Error(error.message);
  } else {
    // insert/update, and soft-delete tombstones, are all idempotent upserts.
    const { error } = await supabase.from(item.table_name).upsert(toRemotePayload(meta, row));
    if (error) throw new Error(error.message);
  }

  await setSyncStatus(item.table_name, item.record_id, 'synced');
  await removeQueueItem(item.id);
}

async function pushPending(): Promise<void> {
  const items = await getQueueItems();
  for (const item of items) {
    try {
      await pushOne(item);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await markQueueFailure(item.id, message);
      // Give up after MAX_RETRIES so a poison record can't block the queue.
      if (item.retry_count + 1 >= MAX_RETRIES) {
        await setSyncStatus(item.table_name, item.record_id, 'failed');
        await removeQueueItem(item.id);
      }
    }
  }
}

// --- pull ------------------------------------------------------------------

async function pullTable(meta: SyncTableMeta): Promise<void> {
  const since = (await getMeta(`pull.${meta.name}`)) ?? EPOCH;
  const { data, error } = await supabase
    .from(meta.name)
    .select('*')
    .gt('updated_at', since)
    .order('updated_at', { ascending: true });
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) return;

  const db = await getDb();
  let maxUpdatedMs = new Date(since).getTime();
  let maxUpdatedStr = since;

  for (const remote of data as Record<string, unknown>[]) {
    const remoteUpdatedAt = String(remote.updated_at);
    const remoteMs = new Date(remoteUpdatedAt).getTime();
    if (remoteMs > maxUpdatedMs) {
      maxUpdatedMs = remoteMs;
      maxUpdatedStr = remoteUpdatedAt;
    }

    const local = await db.getFirstAsync<{ updated_at: string; sync_status: string }>(
      `SELECT updated_at, sync_status FROM ${meta.name} WHERE id = ?`,
      [String(remote.id)],
    );
    if (local) {
      const winner = resolveByUpdatedAt(
        local.updated_at,
        remoteUpdatedAt,
        local.sync_status === 'pending',
      );
      if (winner === 'local') continue; // keep newer/unsynced local copy
    }

    const columns = toLocalColumns(meta, remote);
    const keys = Object.keys(columns);
    const placeholders = keys.map(() => '?').join(', ');
    await db.runAsync(
      `INSERT OR REPLACE INTO ${meta.name} (${keys.join(', ')}) VALUES (${placeholders})`,
      keys.map((k) => columns[k]),
    );
  }

  await setMeta(`pull.${meta.name}`, maxUpdatedStr);
}

// --- public API ------------------------------------------------------------

export async function runSync(): Promise<{ ok: boolean; reason?: string }> {
  if (syncing) return { ok: false, reason: 'already-syncing' };
  if (!(await isOnline())) return { ok: false, reason: 'offline' };

  const { data } = await supabase.auth.getSession();
  if (!data.session) return { ok: false, reason: 'no-session' };

  syncing = true;
  try {
    await pushPending();
    for (const meta of SYNC_TABLES) {
      await pullTable(meta);
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : String(error) };
  } finally {
    syncing = false;
  }
}

/** Start listening for connectivity and run an initial sync. */
export function initSync(): void {
  if (unsubscribeNet) return;
  unsubscribeNet = NetInfo.addEventListener((state) => {
    if (state.isConnected) void runSync();
  });
  void runSync();
}

export function stopSync(): void {
  unsubscribeNet?.();
  unsubscribeNet = null;
}
