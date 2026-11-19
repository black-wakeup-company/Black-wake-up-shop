export interface AdminPinVerifier {
  algorithm: 'PBKDF2-SHA-256';
  iterations: number;
  salt: string;
  hash: string;
}

const ITERATIONS = 310_000;
const SALT_BYTES = 16;
const HASH_BITS = 256;

const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');

const fromHex = (value: string): Uint8Array => {
  if (!/^(?:[0-9a-f]{2})+$/i.test(value)) {
    throw new Error('Vérificateur PIN invalide.');
  }
  return new Uint8Array(value.match(/.{2}/g)!.map((part) => parseInt(part, 16)));
};

const derivePinHash = async (pin: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> => {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pin),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    material,
    HASH_BITS
  );
  return new Uint8Array(bits);
};

export const createAdminPinVerifier = async (pin: string): Promise<AdminPinVerifier> => {
  if (!/^\d{4}$/.test(pin)) {
    throw new Error('Le PIN administrateur doit contenir exactement 4 chiffres.');
  }
  if (!globalThis.crypto?.subtle) {
    throw new Error('Le navigateur ne prend pas en charge le chiffrement sécurisé nécessaire au PIN.');
  }
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await derivePinHash(pin, salt, ITERATIONS);
  return {
    algorithm: 'PBKDF2-SHA-256',
    iterations: ITERATIONS,
    salt: toHex(salt),
    hash: toHex(hash)
  };
};

export const verifyAdminPin = async (pin: string, verifier: AdminPinVerifier): Promise<boolean> => {
  if (!/^\d{4}$/.test(pin)) return false;
  if (verifier.algorithm !== 'PBKDF2-SHA-256'
    || !Number.isInteger(verifier.iterations)
    || verifier.iterations < 100_000
    || verifier.iterations > 1_000_000) {
    throw new Error('Paramètres du vérificateur PIN non valides.');
  }
  const expected = fromHex(verifier.hash);
  const salt = fromHex(verifier.salt);
  const actual = await derivePinHash(pin, salt, verifier.iterations);
  if (actual.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < actual.length; index += 1) {
    difference |= actual[index] ^ expected[index];
  }
  return difference === 0;
};
