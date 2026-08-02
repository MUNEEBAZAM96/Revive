import { secureStore } from './secureStore';

/**
 * Encryption seam for sensitive fields (currently journal content).
 *
 * These are intentionally pass-through today so the rest of the architecture
 * can route sensitive reads/writes through a single choke point. To enable
 * at-rest encryption later:
 *   1. Generate a random data key once, store it via `secureStore` (Keychain).
 *   2. AES-GCM encrypt/decrypt here (e.g. with a native crypto module).
 * No schema change is required — ciphertext is stored in the same TEXT column.
 */

const ENCRYPTION_KEY_NAME = 'revive.journal.dek';

/** Ensures a data-encryption key exists in secure storage (no-op if present). */
export async function ensureEncryptionKey(): Promise<void> {
  const existing = await secureStore.get(ENCRYPTION_KEY_NAME);
  if (existing) return;
  // Placeholder key material; replace with a CSPRNG-generated key when
  // encryption is switched on.
  await secureStore.set(ENCRYPTION_KEY_NAME, 'not-yet-enabled');
}

export async function encryptField(plaintext: string): Promise<string> {
  return plaintext;
}

export async function decryptField(stored: string): Promise<string> {
  return stored;
}
