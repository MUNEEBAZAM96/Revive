import type { SQLiteDatabase } from 'expo-sqlite';

import { up as up001 } from './001_initial';
import { up as up002 } from './002_checkin_status';
import { up as up003 } from './003_revive_gamification';

export interface Migration {
  version: number;
  name: string;
  up: (db: SQLiteDatabase) => Promise<void>;
}

/**
 * Ordered migration list. The runner (database/sqlite.ts) applies any migration
 * whose `version` is greater than SQLite's PRAGMA user_version, inside a
 * transaction, then advances user_version. Add new migrations by appending.
 */
export const migrations: Migration[] = [
  { version: 1, name: '001_initial', up: up001 },
  { version: 2, name: '002_checkin_status', up: up002 },
  { version: 3, name: '003_revive_gamification', up: up003 },
];
