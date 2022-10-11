import crypto from 'crypto';

export const generateRandomHex = (length: number): string =>
  createRandomBytes(length).toString('hex');

const createRandomBytes = (bytes: number): Buffer => crypto.randomBytes(bytes);

export const createOtp = (): number => Number(Math.floor(1000 + Math.random() * 9000).toString());
