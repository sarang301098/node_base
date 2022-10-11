import { promises, existsSync } from 'fs';

export const removeFile = async (file: string): Promise<void> => {
  const exist = existsSync(file);

  if (exist) {
    await promises.unlink(file);
  }
};
