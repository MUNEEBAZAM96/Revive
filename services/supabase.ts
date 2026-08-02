import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { supabaseAuthStorage } from './secureStore';

/**
 * The single Supabase client for the app. The session is persisted in secure
 * storage (Keychain/Keystore) via `supabaseAuthStorage`, never in SQLite.
 *
 * This client is used ONLY by the sync + auth layers. Screens and repositories
 * must not import it directly — they go through repositories -> SQLite, and the
 * SyncManager reconciles with the cloud in the background.
 *
 * The client is created lazily (on first use) rather than at import time so
 * static web prerendering — which imports the module tree in Node — never
 * instantiates the auth client or touches web-only storage APIs.
 */
let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!client) {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;
    if (!url || !key) {
      // Don't crash the app if env vars are missing (createClient would throw).
      // The app is local-first: it runs fully on SQLite; only cloud sync is off.
      console.warn(
        '[supabase] Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_KEY — cloud sync disabled.',
      );
    }
    client = createClient(url ?? 'https://placeholder.supabase.co', key ?? 'placeholder-anon-key', {
      auth: {
        storage: supabaseAuthStorage,
        autoRefreshToken: true,
        persistSession: true,
        // No URL-based auth callbacks in a native app.
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const value = Reflect.get(getClient() as object, prop, receiver);
    return typeof value === 'function' ? value.bind(getClient()) : value;
  },
});
