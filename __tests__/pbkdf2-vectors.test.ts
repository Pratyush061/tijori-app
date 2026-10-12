import CryptoJS from 'crypto-js';

import { deriveKey } from '../src/storage/crypto';

// RFC 7914, section 11: PBKDF2-HMAC-SHA256 with P="passwd", S="salt", c=1 and
// dkLen=64. We derive 32 bytes, which is the first half of that vector. This
// pins the pure-JS derivation to the standard, which is what guarantees the
// native and fallback implementations agree.
it('derives the RFC 7914 PBKDF2-HMAC-SHA256 test vector', () => {
  const key = deriveKey('passwd', CryptoJS.enc.Utf8.parse('salt'), 1);
  expect(key.toString(CryptoJS.enc.Hex)).toBe(
    '55ac046e56e3089fec1691c22544b605f94185216dde0465e68b9d57c20dacbc'
  );
});
