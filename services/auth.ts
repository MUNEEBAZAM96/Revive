import { profileRepository } from '@/repositories/profileRepository';

/**
 * Auth service — now Clerk-centric.
 *
 * Clerk owns session management (sign-up, sign-in, token persistence).
 * This module provides a `getActiveUserId()` helper for the local-first
 * SQLite layer. Since Clerk's React hooks (`useAuth`, `useUser`) can only
 * be called inside components, non-React code (repositories, sync) uses
 * a module-level cache that the React layer sets on sign-in.
 *
 * The Supabase client in `services/supabase.ts` is left untouched — it's
 * only used by the dormant sync layer and doesn't affect auth.
 */

// Stable id used for local rows when no one is signed in (offline dev / seed).
export const DEV_USER_ID = '00000000-0000-4000-8000-000000000000';

/**
 * Module-level cache for the Clerk user id.
 * Set by `setClerkUserId()` from the React layer (e.g. root layout or
 * switchboard) whenever the signed-in user changes.
 */
let _clerkUserId: string | null = null;

/** Call from the React layer when the Clerk session changes. */
export function setClerkUserId(id: string | null): void {
  _clerkUserId = id;
}

/** The id to scope local data by: the Clerk user, or the dev id offline. */
export async function getActiveUserId(): Promise<string> {
  return _clerkUserId ?? DEV_USER_ID;
}

/**
 * Ensure a local profile row exists for the given user. Called after
 * Clerk sign-up/sign-in so the local-first store has something to read.
 */
export async function ensureLocalProfile(
  userId: string,
  displayName?: string,
): Promise<void> {
  await profileRepository.ensureProfile(userId, {
    display_name: displayName,
  });
}
