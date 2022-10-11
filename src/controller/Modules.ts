import { getCustomRepository } from 'typeorm';
import { Request, Response } from 'express';

import { ModulesRepository } from '../repository/Modules';

export const getAll = () => async (req: Request, res: Response): Promise<void> => {
  const moduleRepository = getCustomRepository(ModulesRepository);

  const [modules, count] = await moduleRepository.findAndCount({
    select: ['id', 'name', 'parentId'],
  });

  res.status(200).json({ count, modules });
};
