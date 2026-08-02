import { getDb, newId, nowIso, SqlParam } from '@/database/sqlite';
import { SyncStatus, SyncableTableName, TableName } from '@/database/schema';
import { enqueue } from '@/sync/syncQueue';

/**
 * Shared persistence primitives. Domain repositories serialize their fields to
 * a flat column map and call these helpers, which own the cross-cutting
 * concerns: timestamps, sync_status bookkeeping, and enqueuing for sync.
 *
 * The UI never touches these directly — it goes through a domain repository.
 */

export type ColumnMap = Record<string, SqlParam>;

/** Insert a new row and queue it for upload. */
export async function insertRow(
  table: SyncableTableName,
  id: string,
  data: ColumnMap,
): Promise<void> {
  const db = await getDb();
  const now = nowIso();
  const record: ColumnMap = {
    id,
    ...data,
    created_at: now,
    updated_at: now,
    sync_status: 'pending',
  };
  const columns = Object.keys(record);
  const placeholders = columns.map(() => '?').join(', ');
  await db.runAsync(
    `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
    columns.map((c) => record[c]),
  );
  await enqueue(table, id, 'insert');
}

/** Patch an existing row, bump updated_at, and queue it for upload. */
export async function updateRow(
  table: SyncableTableName,
  id: string,
  data: ColumnMap,
): Promise<void> {
  const db = await getDb();
  const patch: ColumnMap = { ...data, updated_at: nowIso(), sync_status: 'pending' };
  const columns = Object.keys(patch);
  const assignments = columns.map((c) => `${c} = ?`).join(', ');
  await db.runAsync(
    `UPDATE ${table} SET ${assignments} WHERE id = ?`,
    [...columns.map((c) => patch[c]), id],
  );
  await enqueue(table, id, 'update');
}

/** Tombstone a row (soft-delete tables only) and queue the deletion. */
export async function softDeleteRow(table: SyncableTableName, id: string): Promise<void> {
  const db = await getDb();
  const now = nowIso();
  await db.runAsync(
    `UPDATE ${table} SET deleted_at = ?, updated_at = ?, sync_status = 'pending' WHERE id = ?`,
    [now, now, id],
  );
  await enqueue(table, id, 'delete');
}

export async function setSyncStatus(
  table: SyncableTableName,
  id: string,
  status: SyncStatus,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE ${table} SET sync_status = ? WHERE id = ?`, [status, id]);
}

export async function getById<T>(table: TableName, id: string): Promise<T | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<T>(`SELECT * FROM ${table} WHERE id = ?`, [id]);
  return row ?? null;
}

export async function getRows<T>(
  table: TableName,
  where?: string,
  params: SqlParam[] = [],
  orderBy?: string,
): Promise<T[]> {
  const db = await getDb();
  const clause = where ? ` WHERE ${where}` : '';
  const order = orderBy ? ` ORDER BY ${orderBy}` : '';
  return db.getAllAsync<T>(`SELECT * FROM ${table}${clause}${order}`, params);
}

/** Generate an id for a new record (exposed so repos can pre-know the id). */
export { newId };

// --- (de)serialization helpers for JSON/boolean columns --------------------

export function encodeJson(value: unknown): string {
  return JSON.stringify(value ?? null);
}

export function decodeJsonArray(value: unknown): string[] {
  if (typeof value !== 'string' || value.length === 0) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function decodeJsonObject(value: unknown): Record<string, unknown> {
  if (typeof value !== 'string' || value.length === 0) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function toBool(value: unknown): boolean {
  return value === 1 || value === '1' || value === true;
}

export function fromBool(value: boolean): number {
  return value ? 1 : 0;
}
