import { JournalEntry, TABLES } from '@/database/schema';
import { decryptField, encryptField } from '@/services/crypto';

import {
  ColumnMap,
  getById,
  getRows,
  insertRow,
  newId,
  softDeleteRow,
  updateRow,
} from './baseRepository';

/**
 * Private journal. Content is routed through the encryption seam
 * (services/crypto) on the way in and out, so at-rest encryption can be turned
 * on later without touching callers or the schema.
 */

type RawJournal = Record<string, unknown>;

async function mapEntry(row: RawJournal): Promise<JournalEntry> {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    title: (row.title as string) ?? null,
    content: await decryptField(String(row.content ?? '')),
    emotion: (row.emotion as string) ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    sync_status: row.sync_status as JournalEntry['sync_status'],
    deleted_at: (row.deleted_at as string) ?? null,
  };
}

export interface JournalInput {
  title?: string | null;
  content: string;
  emotion?: string | null;
}

export const journalRepository = {
  async list(userId: string): Promise<JournalEntry[]> {
    const rows = await getRows<RawJournal>(
      TABLES.journal_entries,
      'user_id = ? AND deleted_at IS NULL',
      [userId],
      'created_at DESC',
    );
    return Promise.all(rows.map(mapEntry));
  },

  async get(id: string): Promise<JournalEntry | null> {
    const row = await getById<RawJournal>(TABLES.journal_entries, id);
    return row ? mapEntry(row) : null;
  },

  async create(userId: string, input: JournalInput): Promise<string> {
    const id = newId();
    await insertRow(TABLES.journal_entries, id, {
      user_id: userId,
      title: input.title ?? null,
      content: await encryptField(input.content),
      emotion: input.emotion ?? null,
      deleted_at: null,
    });
    return id;
  },

  async update(id: string, input: Partial<JournalInput>): Promise<void> {
    const data: ColumnMap = {};
    if (input.title !== undefined) data.title = input.title;
    if (input.emotion !== undefined) data.emotion = input.emotion;
    if (input.content !== undefined) data.content = await encryptField(input.content);
    await updateRow(TABLES.journal_entries, id, data);
  },

  async remove(id: string): Promise<void> {
    await softDeleteRow(TABLES.journal_entries, id);
  },
};
