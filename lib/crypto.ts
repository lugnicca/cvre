/**
 * Web Crypto API wrapper for client-side encryption
 * Used to encrypt API keys and sensitive data locally
 */

export type EncryptedPayload = {
  iv: string;
  salt: string;
  cipher: string;
};

export const ENCRYPTION_SECRET_KEY = 'cvre_encryption_secret';

export async function deriveKey(
  passphrase: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // Create a new ArrayBuffer to avoid type issues
  const saltBuffer = new Uint8Array(salt.length);
  saltBuffer.set(salt);

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer.buffer,
      iterations: 100_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptJson<T>(
  data: T,
  passphrase: string
): Promise<EncryptedPayload> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);

  const enc = new TextEncoder();
  const plaintext = enc.encode(JSON.stringify(data));

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    plaintext
  );

  return {
    iv: Array.from(iv)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(''),
    salt: Array.from(salt)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(''),
    cipher: Array.from(new Uint8Array(ciphertext))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(''),
  };
}

export async function decryptJson<T>(
  payload: EncryptedPayload,
  passphrase: string
): Promise<T> {
  const ivBytes = payload.iv.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16));
  const saltBytes = payload.salt.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16));
  const cipherBytes = payload.cipher.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16));

  const iv = new Uint8Array(ivBytes);
  const salt = new Uint8Array(saltBytes);
  const ciphertext = new Uint8Array(cipherBytes);

  const key = await deriveKey(passphrase, salt);

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  const dec = new TextDecoder();
  return JSON.parse(dec.decode(plaintext)) as T;
}

export function ensureEncryptionSecret(): string {
  if (typeof window === 'undefined') {
    throw new Error('Encryption secret is only available in the browser environment.');
  }

  const existing = window.localStorage.getItem(ENCRYPTION_SECRET_KEY);
  if (existing) {
    return existing;
  }

  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  const secret = window.btoa(String.fromCharCode(...randomBytes));
  window.localStorage.setItem(ENCRYPTION_SECRET_KEY, secret);
  return secret;
}

export function clearEncryptionSecret(): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.removeItem(ENCRYPTION_SECRET_KEY);
}

