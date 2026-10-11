import * as Keychain from 'react-native-keychain';
import CryptoJS from 'crypto-js';

const AES_SERVICE = 'tijori-aes-key';
const BIOMETRIC_SERVICE = 'tijori-biometric-auth';

let cachedAesKey: string | null = null;

export async function getAESKey(): Promise<string> {
  if (cachedAesKey) return cachedAesKey;

  const credentials = await Keychain.getGenericPassword({ service: AES_SERVICE });
  if (credentials) {
    cachedAesKey = credentials.password;
    return credentials.password;
  }

  const newKey = CryptoJS.lib.WordArray.random(32).toString();
  await Keychain.setGenericPassword('tijori', newKey, { service: AES_SERVICE });
  cachedAesKey = newKey;
  return newKey;
}

export function encryptData(data: string, key: string): string {
  return CryptoJS.AES.encrypt(data, key).toString();
}

export function decryptData(ciphertext: string, key: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (e) {
    console.error('Decryption failed', e);
    return '';
  }
}

export function hashPasscode(passcode: string, salt: string): string {
  return CryptoJS.SHA256(passcode + salt).toString();
}

export function generateSalt(): string {
  return CryptoJS.lib.WordArray.random(16).toString();
}

export async function getSupportedBiometry() {
  return await Keychain.getSupportedBiometryType();
}

export async function enableBiometricAuth() {
  await Keychain.setGenericPassword('tijori', 'biometric-enabled', {
    service: BIOMETRIC_SERVICE,
    accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
  });
}

export async function disableBiometricAuth() {
  await Keychain.resetGenericPassword({ service: BIOMETRIC_SERVICE });
}

export async function authenticateWithBiometrics(): Promise<boolean> {
  try {
    const credentials = await Keychain.getGenericPassword({
      service: BIOMETRIC_SERVICE,
      authenticationPrompt: { title: 'Unlock Tijori' },
    });
    return !!credentials;
  } catch (e) {
    return false;
  }
}
