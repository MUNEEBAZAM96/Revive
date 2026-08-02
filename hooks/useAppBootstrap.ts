/**
 * UI-ONLY MODE: the local-first bootstrap (SQLite migrations, dev seed, sync)
 * is disconnected while we iterate on the UI, so there is nothing to wait for —
 * the app is always ready to render. Restore the DB/sync init here (see git
 * history of this file) to turn the local-first backend back on.
 */
export function useAppBootstrap(): boolean {
  return true;
}
