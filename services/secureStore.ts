import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Secure key/value storage.
 *
 * Native: expo-secure-store (Keychain / Keystore) — the only place we keep the
 * Supabase session and any future encryption keys. Tokens NEVER live in SQLite.
 *
 * Web (used for local dev / `expo export --platform web` only): SecureStore is
 * unavailable, so we fall back to AsyncStorage. Do not ship the web target to
 * production with real secrets without a stronger store.
 */
const isWeb = Platform.OS === 'web';

async function setRaw(key: string, value: string): Promise<void> {
  if (isWeb) {
    // Guarded: web storage is unavailable during Node static prerender.
    try {
      await AsyncStorage.setItem(key, value);
    } catch {
      /* no-op */
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getRaw(key: string): Promise<string | null> {
  if (isWeb) {
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

async function deleteRaw(key: string): Promise<void> {
  if (isWeb) {
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      /* no-op */
    }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export const secureStore = {
  get: getRaw,
  set: setRaw,
  delete: deleteRaw,
};

// iOS SecureStore rejects values larger than 2048 bytes. Supabase sessions
// (JWT + refresh token) routinely exceed that, so the auth storage adapter
// transparently splits values into chunks.
const CHUNK_SIZE = 1800;

/**
 * Storage adapter passed to supabase-js `auth.storage`. Presents a normal
 * get/set/remove interface while chunking large values under the hood.
 */
export const supabaseAuthStorage = {
  async getItem(key: string): Promise<string | null> {
    const countRaw = await getRaw(`${key}.c`);
    if (countRaw == null) {
      // Fall back to a plain (unchunked) value for older sessions.
      return getRaw(key);
    }
    const count = Number.parseInt(countRaw, 10);
    let value = '';
    for (let i = 0; i < count; i += 1) {
      value += (await getRaw(`${key}.p${i}`)) ?? '';
    }
    return value;
  },

  async setItem(key: string, value: string): Promise<void> {
    const previous = await getRaw(`${key}.c`);
    const previousCount = previous ? Number.parseInt(previous, 10) : 0;

    const count = Math.max(1, Math.ceil(value.length / CHUNK_SIZE));
    await setRaw(`${key}.c`, String(count));
    for (let i = 0; i < count; i += 1) {
      await setRaw(`${key}.p${i}`, value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE));
    }
    // Remove any leftover chunks if the new value is shorter than the old one.
    for (let i = count; i < previousCount; i += 1) {
      await deleteRaw(`${key}.p${i}`);
    }
    await deleteRaw(key); // drop any legacy unchunked value
  },

  async removeItem(key: string): Promise<void> {
    const countRaw = await getRaw(`${key}.c`);
    const count = countRaw ? Number.parseInt(countRaw, 10) : 0;
    for (let i = 0; i < count; i += 1) {
      await deleteRaw(`${key}.p${i}`);
    }
    await deleteRaw(`${key}.c`);
    await deleteRaw(key);
  },
};
