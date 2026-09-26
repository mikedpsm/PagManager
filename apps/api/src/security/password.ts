import { timingSafeEqual, webcrypto } from 'node:crypto';

const ALGORITHM = 'pbkdf2';
const ITERATIONS = 600_000;
const SALT_BYTES = 16;
const KEY_LENGTH_BITS = 256;

function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const buffer = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return Buffer.from(buffer).toString('base64url');
}

function fromBase64Url(value: string): Uint8Array {
  return new Uint8Array(Buffer.from(value, 'base64url'));
}

async function derive(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<Uint8Array> {
  const keyMaterial = await webcrypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );

  const derived = await webcrypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as NodeJS.BufferSource,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_LENGTH_BITS,
  );

  return new Uint8Array(derived);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = webcrypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await derive(password, salt, ITERATIONS);

  return `${ALGORITHM}$${ITERATIONS}$${toBase64Url(salt)}$${toBase64Url(hash)}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  try {
    const parts = stored.split('$');
    if (parts.length !== 4) {
      return false;
    }

    const [algorithm, iterationsRaw, saltB64, hashB64] = parts;
    if (algorithm !== ALGORITHM) {
      return false;
    }

    const iterations = Number(iterationsRaw);
    if (!Number.isInteger(iterations) || iterations <= 0) {
      return false;
    }

    if (!saltB64 || !hashB64) {
      return false;
    }

    const salt = fromBase64Url(saltB64);
    const expectedHash = fromBase64Url(hashB64);

    const actualHash = await derive(password, salt, iterations);

    if (actualHash.length !== expectedHash.length) {
      return false;
    }

    return timingSafeEqual(actualHash, expectedHash);
  } catch {
    return false;
  }
}
