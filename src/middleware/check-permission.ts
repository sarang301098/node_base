import { Request, Response, NextFunction } from 'express';

import { ForbiddenError } from '../error';
import logger from '../service/log';

export const checkPermission = () => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { user = null } = req;

    if (!user) {
      logger.error(`User does not exist`);
      return next(new ForbiddenError(`User does not exist`));
    }

    return next();
  };
};
