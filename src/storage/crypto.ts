/* eslint-disable no-bitwise */
import CryptoJS from 'crypto-js';
import * as QuickCrypto from 'react-native-quick-crypto';

/**
 * Tijori's at-rest encryption primitives.
 *
 * The vault is protected by a passcode only (no biometrics, no native keychain).
 * A 256-bit AES key is derived from the passcode with PBKDF2-HMAC-SHA256, and
 * every stored value is encrypted with AES-CBC.
 *
 * The derivation runs on react-native-quick-crypto's native PBKDF2 (C++ over
 * OpenSSL) when that module is present, which is well over 100x faster than
 * doing the same work in JavaScript - the difference between a ~20 second
 * unlock and a sub-second one. PBKDF2 is standardised, so the native and the
 * pure-JS paths derive byte-for-byte the same key; the JavaScript path is kept
 * only as a fallback for environments without the native module (unit tests, or
 * a build where it failed to load).
 */

// Prefix written in front of every ciphertext so a stored value can be told
// apart from legacy plaintext (written before encryption existed).
export const ENC_MARKER = 'tijori1:';

const KEY_SIZE_WORDS = 256 / 32;
const KEY_SIZE_BYTES = KEY_SIZE_WORDS * 4;
const SALT_BYTES = 16;
const IV_BYTES = 16;

// Work factor for new vaults: the OWASP recommendation for PBKDF2-HMAC-SHA256.
// It is stored with the vault, so a vault always unlocks with the value it was
// created with - vaults made before this existed use LEGACY_PBKDF2_ITERATIONS.
export const PBKDF2_ITERATIONS = 600000;
export const LEGACY_PBKDF2_ITERATIONS = 150000;

// How many rounds run between yields to the JS event loop in the fallback.
const PBKDF2_YIELD_EVERY = 25000;

export type VaultKey = CryptoJS.lib.WordArray;

type NativePbkdf2 = {
  pbkdf2Sync: (
    password: string,
    salt: Uint8Array,
    iterations: number,
    keylen: number,
    digest: string
  ) => Uint8Array;
  pbkdf2: (
    password: string,
    salt: Uint8Array,
    iterations: number,
    keylen: number,
    digest: string,
    callback: (err: Error | null, key: Uint8Array) => void
  ) => void;
};

// The native module is optional: it is absent under Jest, and a build where it
// failed to load must still be able to open the vault.
const nativeCrypto = QuickCrypto as unknown as Partial<NativePbkdf2>;

/**
 * The work factor to use when creating a vault. Tests override it (see the
 * __TIJORI_PBKDF2_ITERATIONS__ hook) so the suite does not pay for 600k rounds.
 */
export function pbkdf2Iterations(): number {
  const override = (
    globalThis as { __TIJORI_PBKDF2_ITERATIONS__?: number }
  ).__TIJORI_PBKDF2_ITERATIONS__;
  return typeof override === 'number' && override > 0
    ? override
    : PBKDF2_ITERATIONS;
}

function wordArrayToBytes(wa: CryptoJS.lib.WordArray): Uint8Array {
  const bytes = new Uint8Array(wa.sigBytes);
  for (let i = 0; i < wa.sigBytes; i++) {
    bytes[i] = (wa.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
  }
  return bytes;
}

function bytesToWordArray(bytes: Uint8Array): CryptoJS.lib.WordArray {
  const words: number[] = [];
  for (let i = 0; i < bytes.length; i++) {
    words[i >>> 2] = (words[i >>> 2] || 0) | (bytes[i] << (24 - (i % 4) * 8));
  }
  return CryptoJS.lib.WordArray.create(words, bytes.length);
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
 * Synchronous PBKDF2. Kept for the test that checks the async implementation
 * derives the same key; the app always derives asynchronously so the JS thread
 * is never blocked.
 */
export function deriveKey(
  passcode: string,
  salt: CryptoJS.lib.WordArray,
  iterations: number = pbkdf2Iterations()
): VaultKey {
  const pbkdf2Sync = nativeCrypto.pbkdf2Sync;
  if (typeof pbkdf2Sync === 'function') {
    try {
      return bytesToWordArray(
        pbkdf2Sync(
          passcode,
          wordArrayToBytes(salt),
          iterations,
          KEY_SIZE_BYTES,
          'sha256'
        )
      );
    } catch {
      // Fall through to the JavaScript implementation.
    }
  }

  return CryptoJS.PBKDF2(passcode, salt, {
    keySize: KEY_SIZE_WORDS,
    iterations,
    hasher: CryptoJS.algo.SHA256,
  });
}

function yieldToEventLoop(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * PBKDF2-HMAC-SHA256 with the same parameters and byte-for-byte the same output
 * as {@link deriveKey}, implemented in JavaScript and yielding to the event
 * loop between chunks of rounds so the JS thread can keep painting.
 */
async function deriveKeyInJs(
  passcode: string,
  salt: CryptoJS.lib.WordArray,
  total: number
): Promise<VaultKey> {
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

/**
 * PBKDF2-HMAC-SHA256, preferring the native implementation so the derivation
 * runs off the JS thread. Falls back to the JavaScript implementation whenever
 * the native module is unavailable, which produces the identical key.
 */
export async function deriveKeyAsync(
  passcode: string,
  salt: CryptoJS.lib.WordArray,
  iterations: number = pbkdf2Iterations()
): Promise<VaultKey> {
  const pbkdf2 = nativeCrypto.pbkdf2;
  if (typeof pbkdf2 === 'function') {
    try {
      const derived = await new Promise<Uint8Array>((resolve, reject) => {
        pbkdf2(
          passcode,
          wordArrayToBytes(salt),
          iterations,
          KEY_SIZE_BYTES,
          'sha256',
          (err, key) => (err ? reject(err) : resolve(key))
        );
      });
      return bytesToWordArray(derived);
    } catch {
      // Fall through to the JavaScript implementation.
    }
  }

  return deriveKeyInJs(passcode, salt, iterations);
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
