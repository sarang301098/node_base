import crypto from 'crypto';

/**
 * Generate a random key
 * The default length of key is 32 (length * 2).
 *
 * @param length - of buffer to generate key
 *
 * @returns random string with double the length of buffer length
 */
export const generateKey = (length = 16): string => {
  const buf = Buffer.alloc(length);
  return crypto.randomFillSync(buf).toString('hex');
};
