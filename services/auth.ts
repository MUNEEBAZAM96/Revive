import type { Session } from '@supabase/supabase-js';

import { profileRepository } from '@/repositories/profileRepository';

import { supabase } from './supabase';

/**
 * Auth flow (local-first):
 *   sign up -> Supabase creates the auth user -> we create the LOCAL profile
 *   row immediately (so the app is usable offline) -> session persists in
 *   secure storage -> SyncManager pushes the profile when online.
 */

// Stable id used for local rows when no one is signed in (offline dev / seed).
// Real sessions use the Supabase auth user id instead.
export const DEV_USER_ID = '00000000-0000-4000-8000-000000000000';

/** The id to scope local data by: the signed-in user, or the dev id offline. */
export async function getActiveUserId(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? DEV_USER_ID;
}

export async function signUp(email: string, password: string): Promise<Session | null> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  if (data.user) {
    await profileRepository.ensureProfile(data.user.id, {
      display_name: email.split('@')[0],
    });
  }
  return data.session;
}

export async function signIn(email: string, password: string): Promise<Session | null> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (data.user) {
    await profileRepository.ensureProfile(data.user.id);
  }
  return data.session;
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

/** Subscribe to session changes; returns an unsubscribe function. */
export function onAuthStateChange(callback: (session: Session | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}
