import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  deriveKey,
  makeSalt,
  encryptString,
  decryptString,
  ENC_MARKER,
} from '../src/storage/crypto';
import {
  initializeVault,
  unlockVault,
  secureGet,
  secureSet,
  isVaultInitialized,
  changePasscode,
  lock,
} from '../src/storage/secureStore';

jest.mock('@react-native-async-storage/async-storage', () => {
  const cache: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => Promise.resolve(cache[key] ?? null)),
    setItem: jest.fn((key: string, value: string) => {
      cache[key] = value;
      return Promise.resolve(null);
    }),
    removeItem: jest.fn((key: string) => {
      delete cache[key];
      return Promise.resolve(null);
    }),
    clear: jest.fn(() => {
      Object.keys(cache).forEach(k => delete cache[k]);
      return Promise.resolve(null);
    }),
  };
});

describe('crypto primitives', () => {
  it('derives the same key for the same passcode and salt', () => {
    const salt = makeSalt();
    expect(deriveKey('1234', salt).toString()).toBe(deriveKey('1234', salt).toString());
  });

  it('derives a different key for a different salt', () => {
    expect(deriveKey('1234', makeSalt()).toString()).not.toBe(
      deriveKey('1234', makeSalt()).toString()
    );
  });

  it('round-trips a string through encrypt/decrypt', () => {
    const key = deriveKey('pw', makeSalt());
    const cipher = encryptString('hello world', key);
    expect(cipher.startsWith(ENC_MARKER)).toBe(true);
    expect(cipher.includes('hello world')).toBe(false);
    expect(decryptString(cipher, key)).toBe('hello world');
  });

  it('returns null when the key is wrong', () => {
    const cipher = encryptString('secret', deriveKey('right', makeSalt()));
    expect(decryptString(cipher, deriveKey('wrong', makeSalt()))).toBeNull();
  });

  it('returns null for an unmarked value', () => {
    expect(decryptString('just plain text', deriveKey('x', makeSalt()))).toBeNull();
  });

  it('produces a different ciphertext each time (random IV)', () => {
    const key = deriveKey('pw', makeSalt());
    expect(encryptString('same', key)).not.toBe(encryptString('same', key));
  });
});

describe('secureStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    lock();
  });

  it('reports uninitialized, then initialized after setup', async () => {
    expect(await isVaultInitialized()).toBe(false);
    await initializeVault('1234');
    expect(await isVaultInitialized()).toBe(true);
  });

  it('unlocks only with the correct passcode', async () => {
    await initializeVault('1234');
    lock();
    expect(await unlockVault('0000')).toBe(false);
    expect(await unlockVault('1234')).toBe(true);
  });

  it('encrypts writes and refuses them while locked', async () => {
    await initializeVault('1234');
    await secureSet('@tijori_notes', '[]');
    expect(await secureGet('@tijori_notes')).toBe('[]');

    const raw = (await AsyncStorage.getItem('@tijori_notes')) as string;
    expect(raw.startsWith(ENC_MARKER)).toBe(true);

    lock();
    await expect(secureSet('@tijori_notes', '[]')).rejects.toThrow();
  });

  it('changes the passcode and keeps the data readable', async () => {
    await initializeVault('1234');
    await secureSet('@tijori_notes', JSON.stringify([{ id: '1' }]));

    expect(await changePasscode('wrong', '9999')).toBe(false);
    expect(await changePasscode('1234', '9999')).toBe(true);

    lock();
    expect(await unlockVault('1234')).toBe(false);
    expect(await unlockVault('9999')).toBe(true);
    expect(await secureGet('@tijori_notes')).toBe(JSON.stringify([{ id: '1' }]));
  });
});
