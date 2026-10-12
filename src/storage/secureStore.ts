import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';

import {
  ENC_MARKER,
  deriveKeyAsync,
  decryptString,
  encryptString,
  makeSalt,
  type VaultKey,
} from './crypto';

/**
 * The encrypted wrapper the rest of the app reads and writes through.
 *
 * A single AES key lives in memory only while the vault is unlocked. Values
 * written before encryption existed are plain JSON with no marker; those are
 * still readable and are re-encrypted the next time they are written, so no
 * data is lost on upgrade.
 */

const VERIFIER_KEY = '@tijori_verifier';
const VERIFIER_PLAIN = 'tijori-vault-v1';

export const DATA_KEYS = [
  '@tijori_passwords',
  '@tijori_birthdays',
  '@tijori_notes',
  '@tijori_cards',
  '@tijori_documents',
] as const;

let activeKey: VaultKey | null = null;

export function isUnlocked(): boolean {
  return activeKey !== null;
}

export function lock(): void {
  activeKey = null;
}

export const AUTOLOCK_KEY = '@tijori_autolock';

export async function getAutoLockTimeout(): Promise<number> {
  const val = await AsyncStorage.getItem(AUTOLOCK_KEY);
  if (val == null) return 0; // Default: Immediately (0 seconds)
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? 0 : parsed;
}

export async function setAutoLockTimeout(seconds: number): Promise<void> {
  await AsyncStorage.setItem(AUTOLOCK_KEY, String(seconds));
}

export async function isVaultInitialized(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(VERIFIER_KEY);
  return !!raw;
}

/**
 * Derives a fresh key from the passcode and stores a verifier blob that can
 * only be decrypted with that same key. The salt is stored alongside it — a
 * salt is not secret, it only has to be unique.
 */
export async function initializeVault(passcode: string): Promise<void> {
  const salt = makeSalt();
  const key = await deriveKeyAsync(passcode, salt);
  const blob = JSON.stringify({
    salt: salt.toString(CryptoJS.enc.Base64),
    v: encryptString(VERIFIER_PLAIN, key),
  });
  await AsyncStorage.setItem(VERIFIER_KEY, blob);
  activeKey = key;
}

export async function unlockVault(passcode: string): Promise<boolean> {
  const raw = await AsyncStorage.getItem(VERIFIER_KEY);
  if (!raw) return false;

  let parsed: { salt?: string; v?: string };
  try {
    parsed = JSON.parse(raw);
  } catch {
    return false;
  }
  if (!parsed.salt || !parsed.v) return false;

  const salt = CryptoJS.enc.Base64.parse(parsed.salt);
  const key = await deriveKeyAsync(passcode, salt);
  if (decryptString(parsed.v, key) !== VERIFIER_PLAIN) return false;

  activeKey = key;
  return true;
}

export async function secureGet(key: string): Promise<string | null> {
  const raw = await AsyncStorage.getItem(key);
  if (raw == null) return null;

  if (raw.startsWith(ENC_MARKER)) {
    if (!activeKey) throw new Error('Vault is locked');
    const plain = decryptString(raw, activeKey);
    if (plain == null) throw new Error('Could not decrypt stored data');
    return plain;
  }

  // Legacy plaintext from before encryption — returned as-is and upgraded on
  // the next write.
  return raw;
}

export async function secureSet(key: string, value: string): Promise<void> {
  if (!activeKey) throw new Error('Vault is locked');
  await AsyncStorage.setItem(key, encryptString(value, activeKey));
}

/**
 * Re-keys the vault: reads everything with the current passcode, installs a
 * new key, and writes it all back. Returns false if the current passcode is
 * wrong (nothing is changed in that case).
 */
export async function changePasscode(
  current: string,
  next: string
): Promise<boolean> {
  const ok = await unlockVault(current);
  if (!ok) return false;

  const snapshot: Record<string, string | null> = {};
  for (const k of DATA_KEYS) {
    snapshot[k] = await secureGet(k);
  }

  await initializeVault(next);

  for (const k of DATA_KEYS) {
    if (snapshot[k] != null) {
      await secureSet(k, snapshot[k] as string);
    }
  }
  return true;
}
