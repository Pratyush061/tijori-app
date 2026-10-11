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
const PBKDF2_ITERATIONS = 150000;
const PBKDF2_YIELD_EVERY = 500;

export type VaultKey = CryptoJS.lib.WordArray;

/**
 * Generate random bytes only from a cryptographically secure source.
 * index.js loads react-native-get-random-values before app modules, backed by
 * Android's SecureRandom. Refuse to create vault material if that source is
 * unavailable rather than silently falling back to Math.random.
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

  // Pack bytes explicitly so non-multiples of four do not get padded with
  // undefined values. WordArray.sigBytes records the exact requested length.
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
 * Synchronous PBKDF2 retained for compatibility and test-vector comparison.
 * Prefer deriveKeyAsync in app flows so the JavaScript thread can process UI
 * work while all 150,000 PBKDF2-HMAC-SHA256 rounds are performed.
 */
export function deriveKey(passcode: string, salt: CryptoJS.lib.WordArray): VaultKey {
  return CryptoJS.PBKDF2(passcode, salt, {
    keySize: KEY_SIZE_WORDS,
    iterations: PBKDF2_ITERATIONS,
    hasher: CryptoJS.algo.SHA256,
  });
}

function yieldToUi(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Incremental PBKDF2-HMAC-SHA256 implementation with the same parameters and
 * byte-for-byte output as CryptoJS.PBKDF2 above. Yielding between chunks keeps
 * Android's JS thread responsive without weakening the 150,000-iteration KDF.
 */
export async function deriveKeyAsync(
  passcode: string,
  salt: CryptoJS.lib.WordArray
): Promise<VaultKey> {
  const hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, passcode);
  const derivedKey = CryptoJS.lib.WordArray.create();
  const blockIndex = CryptoJS.lib.WordArray.create([1]);

  while (derivedKey.words.length < KEY_SIZE_WORDS) {
    const block = hmac.update(salt).finalize(blockIndex);
    hmac.reset();

    const blockWords = block.words;
    let intermediate = block.clone();

    for (let iteration = 1; iteration < PBKDF2_ITERATIONS; iteration++) {
      intermediate = hmac.finalize(intermediate);
      hmac.reset();

      const intermediateWords = intermediate.words;
      for (let i = 0; i < blockWords.length; i++) {
        blockWords[i] ^= intermediateWords[i];
      }

      if (iteration % PBKDF2_YIELD_EVERY === 0) {
        await yieldToUi();
      }
    }

    derivedKey.concat(block);
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
