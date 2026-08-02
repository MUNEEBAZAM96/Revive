import * as Crypto from 'expo-crypto';
import * as SQLite from 'expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';

import { migrations } from './migrations';

const DATABASE_NAME = 'revive.db';

/** Values SQLite can bind directly. Booleans are stored as 0/1 by callers. */
export type SqlParam = string | number | null;

let dbPromise: Promise<SQLiteDatabase> | null = null;

/**
 * Lazily opens (once) the local database. All data access goes through this —
 * repositories never open their own connection.
 */
export async function getDb(): Promise<SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DATABASE_NAME);
  }
  return dbPromise;
}

/** UUID for offline-created rows (same id used locally and in Supabase). */
export function newId(): string {
  return Crypto.randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Opens the DB, sets pragmas, and runs pending migrations. Call once at
 * startup before any repository is used.
 */
export async function initDatabase(): Promise<void> {
  const db = await getDb();
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  await runMigrations(db);
}

async function runMigrations(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let current = row?.user_version ?? 0;

  for (const migration of migrations) {
    if (migration.version <= current) continue;
    // Each migration is atomic: either the whole DDL applies or none of it.
    await db.withTransactionAsync(async () => {
      await migration.up(db);
    });
    // `version` is an integer we control, so string interpolation is safe here
    // (PRAGMA does not accept bound parameters).
    await db.execAsync(`PRAGMA user_version = ${migration.version}`);
    current = migration.version;
  }
}

// --- sync_meta helpers (last pull timestamps, etc.) ------------------------

export async function getMeta(key: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM sync_meta WHERE key = ?',
    [key],
  );
  return row?.value ?? null;
}

export async function setMeta(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO sync_meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, value],
  );
}

/** Test/dev helper: wipe all data (keeps schema). */
export async function resetDatabase(): Promise<void> {
  const db = await getDb();
  await db.execAsync(`
    DELETE FROM profiles;
    DELETE FROM daily_checkins;
    DELETE FROM journal_entries;
    DELETE FROM recovery_events;
    DELETE FROM user_triggers;
    DELETE FROM coach_memory;
    DELETE FROM sync_queue;
    DELETE FROM sync_meta;
  `);
}
