/**
 * Conflict strategy: Last Updated Wins.
 *
 * The newer `updated_at` wins. On an exact tie we prefer the remote
 * (authoritative) copy — unless the local row still has unsynced edits, in
 * which case the local version is kept so the user never loses in-flight work.
 */

export type ConflictWinner = 'local' | 'remote';

export function resolveByUpdatedAt(
  localUpdatedAt: string,
  remoteUpdatedAt: string,
  localHasPendingChanges: boolean,
): ConflictWinner {
  const local = new Date(localUpdatedAt).getTime();
  const remote = new Date(remoteUpdatedAt).getTime();

  if (remote > local) return 'remote';
  if (local > remote) return 'local';
  return localHasPendingChanges ? 'local' : 'remote';
}
