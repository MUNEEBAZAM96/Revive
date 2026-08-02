import { getDb, newId, nowIso } from '@/database/sqlite';
import { SyncOperation, SyncQueueItem, SyncableTableName } from '@/database/schema';

/**
 * The sync queue records every local mutation so it can be replayed to Supabase
 * when connectivity returns. Repositories enqueue via this module; the
 * SyncManager drains it.
 */

export async function enqueue(
  table: SyncableTableName,
  recordId: string,
  operation: SyncOperation,
): Promise<void> {
  const db = await getDb();
  // Collapse repeated edits to the same record: an existing pending op already
  // means "push the current row", so we only need one queue entry per record
  // (unless it's a delete, which must supersede an insert/update).
  await db.runAsync(
    'DELETE FROM sync_queue WHERE table_name = ? AND record_id = ?',
    [table, recordId],
  );
  await db.runAsync(
    `INSERT INTO sync_queue (id, table_name, record_id, operation, created_at, retry_count)
     VALUES (?, ?, ?, ?, ?, 0)`,
    [newId(), table, recordId, operation, nowIso()],
  );
}

export async function getQueueItems(): Promise<SyncQueueItem[]> {
  const db = await getDb();
  return db.getAllAsync<SyncQueueItem>(
    'SELECT * FROM sync_queue ORDER BY created_at ASC',
  );
}

export async function removeQueueItem(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM sync_queue WHERE id = ?', [id]);
}

export async function markQueueFailure(id: string, error: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE sync_queue SET retry_count = retry_count + 1, last_error = ? WHERE id = ?',
    [error, id],
  );
}
