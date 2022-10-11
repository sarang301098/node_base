import { hash, compare } from 'bcryptjs';

export const hashPassword = async (password: string): Promise<string> => {
  const hashedPassword = await hash(password, 10);
  return hashedPassword;
};

export const comparePassword = (password: string, hashedPassword: string): Promise<boolean> => {
  return compare(password, hashedPassword);
};
