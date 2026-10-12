/* eslint-disable no-bitwise */
import CryptoJS from 'crypto-js';

/**
 * Tijori's at-rest encryption primitives.
 *
 * The vault is protected by a passcode only (no biometrics, no native
 * keychain). A 256-bit AES key is derived from the passcode with PBKDF2, and
 * every stored value is encrypted with AES-CBC. Nothing here needs a native
 * module beyond `crypto-js`, so the Android build stays predictable.
 */

// Prefix written in front of every ciphertext so a stored value can be told
// apart from legacy plaintext (written before encryption existed).
export const ENC_MARKER = 'tijori1:';

const KEY_SIZE_WORDS = 256 / 32;
const SALT_BYTES = 16;
const IV_BYTES = 16;

// PBKDF2-HMAC-SHA256 rounds. This is deliberately expensive; it is the main
// cost of unlocking. Tests override it (see the __TIJORI_PBKDF2_ITERATIONS__
// hook) so the suite exercises correctness without paying for it.
const DEFAULT_PBKDF2_ITERATIONS = 150000;

// How many rounds run between yields to the JS event loop. Yielding keeps the
// UI (and the busy spinner) alive during the KDF; doing it rarely keeps the
// setTimeout overhead negligible.
const PBKDF2_YIELD_EVERY = 25000;

export type VaultKey = CryptoJS.lib.WordArray;

function iterations(): number {
  const override = (
    globalThis as { __TIJORI_PBKDF2_ITERATIONS__?: number }
  ).__TIJORI_PBKDF2_ITERATIONS__;
  return typeof override === 'number' && override > 0
    ? override
    : DEFAULT_PBKDF2_ITERATIONS;
}

/**
 * Random bytes from a cryptographically secure source only.
 *
 * index.js loads react-native-get-random-values before the app modules, which
 * backs `crypto.getRandomValues` with Android's SecureRandom; Node/Jest provide
 * it natively. If that source is missing we refuse rather than silently fall
 * back to Math.random, which would weaken every key and IV we generate.
 */
export function randomBytes(nBytes: number): CryptoJS.lib.WordArray {
  const g = globalThis as unknown as {
    crypto?: { getRandomValues?: (a: Uint8Array) => Uint8Array };
    msCrypto?: { getRandomValues?: (a: Uint8Array) => Uint8Array };
  };
  const source = g.crypto ?? g.msCrypto;
  if (!source || typeof source.getRandomValues !== 'function') {
    throw new Error('Secure random number generation is unavailable.');
  }

  const buf = new Uint8Array(nBytes);
  source.getRandomValues(buf);

  // Pack bytes explicitly so a length that is not a multiple of four is not
  // padded with undefined words; WordArray.sigBytes records the real length.
  const words = new Array<number>(Math.ceil(nBytes / 4)).fill(0);
  for (let i = 0; i < nBytes; i++) {
    words[Math.floor(i / 4)] |= buf[i] << (24 - (i % 4) * 8);
  }

  return CryptoJS.lib.WordArray.create(words, nBytes);
}

export function makeSalt(): CryptoJS.lib.WordArray {
  return randomBytes(SALT_BYTES);
}

/**
 * Synchronous PBKDF2. Kept for compatibility and for the test that checks the
 * async implementation produces byte-for-byte the same key.
 */
export function deriveKey(passcode: string, salt: CryptoJS.lib.WordArray): VaultKey {
  return CryptoJS.PBKDF2(passcode, salt, {
    keySize: KEY_SIZE_WORDS,
    iterations: iterations(),
    hasher: CryptoJS.algo.SHA256,
  });
}

function yieldToEventLoop(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * PBKDF2-HMAC-SHA256 with the same parameters and byte-for-byte the same
 * output as {@link deriveKey}, but yielding to the event loop between chunks of
 * rounds so the JS thread can keep painting during the derivation.
 */
export async function deriveKeyAsync(
  passcode: string,
  salt: CryptoJS.lib.WordArray
): Promise<VaultKey> {
  const total = iterations();
  // A fresh HMAC per PRF call is required: crypto-js's HMAC cannot be reused
  // across messages (reusing one instance silently diverges from standard
  // PBKDF2 from the third round on). Parsing the key once keeps it cheap.
  const key = CryptoJS.enc.Utf8.parse(passcode);
  const prf = (message: CryptoJS.lib.WordArray) =>
    CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, key).finalize(message);

  const derivedKey = CryptoJS.lib.WordArray.create();
  const blockIndex = CryptoJS.lib.WordArray.create([1]);

  while (derivedKey.words.length < KEY_SIZE_WORDS) {
    // U1 = HMAC(passcode, salt || INT(i))
    let u = prf(salt.clone().concat(blockIndex));
    const acc = u.clone();
    let sinceYield = 0;

    for (let i = 1; i < total; i++) {
      u = prf(u);
      for (let w = 0; w < acc.words.length; w++) {
        acc.words[w] ^= u.words[w];
      }
      if (++sinceYield >= PBKDF2_YIELD_EVERY) {
        sinceYield = 0;
        await yieldToEventLoop();
      }
    }

    derivedKey.concat(acc);
    blockIndex.words[0]++;
  }

  derivedKey.sigBytes = KEY_SIZE_WORDS * 4;
  derivedKey.clamp();
  return derivedKey;
}

export function encryptString(plain: string, key: VaultKey): string {
  const iv = randomBytes(IV_BYTES);
  const encrypted = CryptoJS.AES.encrypt(plain, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  const ivB64 = iv.toString(CryptoJS.enc.Base64);
  const ctB64 = encrypted.ciphertext.toString(CryptoJS.enc.Base64);
  return `${ENC_MARKER}${ivB64}:${ctB64}`;
}

/**
 * Decrypts a value produced by {@link encryptString}. Returns null when the
 * payload is not encrypted, is malformed, or the key is wrong — the caller
 * treats null as "could not read".
 */
export function decryptString(payload: string, key: VaultKey): string | null {
  if (!payload.startsWith(ENC_MARKER)) return null;
  const rest = payload.slice(ENC_MARKER.length);
  const sep = rest.indexOf(':');
  if (sep < 0) return null;

  try {
    const iv = CryptoJS.enc.Base64.parse(rest.slice(0, sep));
    const ciphertext = CryptoJS.enc.Base64.parse(rest.slice(sep + 1));
    const decrypted = CryptoJS.AES.decrypt(
      CryptoJS.lib.CipherParams.create({ ciphertext }),
      key,
      { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
    );
    const text = decrypted.toString(CryptoJS.enc.Utf8);
    return text.length > 0 ? text : null;
  } catch {
    return null;
  }
}

/**
 * A uniform random integer in [0, maxExclusive) drawn from the secure byte
 * source, using rejection sampling so there is no modulo bias.
 */
export function randomInt(maxExclusive: number): number {
  if (maxExclusive <= 1) return 0;
  const limit = Math.floor(0x100000000 / maxExclusive) * maxExclusive;
  let x = 0;
  do {
    x = randomBytes(4).words[0] >>> 0;
  } while (x >= limit);
  return x % maxExclusive;
}

export function randomId(): string {
  return `${Date.now().toString(36)}-${randomBytes(12).toString(CryptoJS.enc.Hex)}`;
}

export function secureRandomString(length: number): string {
  const bytes = randomBytes(length * 2);
  return bytes.toString(CryptoJS.enc.Hex).slice(0, length);
}
