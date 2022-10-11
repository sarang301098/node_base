import { createHash } from 'crypto';

export const createSHA256Hash = (data: string): string => {
  return createHash('sha256').update(data).digest('hex');
};
