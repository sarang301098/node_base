import { getRepository } from 'typeorm';
import { RequestHandler } from 'express';
import { find, get } from 'lodash';

import logger from '../service/log';
import { ForbiddenError } from '../error';
import { PropaneBaseRoutes, MapPropaneBaseRoutes, ApiMethods } from '../constants';

import { Users } from '../model/Users';

export const handelPermission: RequestHandler = async (request, response, next): Promise<void> => {
  const { user = null } = request;
  const usersRepo = getRepository(Users);

  const subAdminDetails = await usersRepo.findOneOrFail({
    where: { id: user?.id },
    relations: ['subAdmin', 'subAdmin.role', 'subAdmin.role.permissions'],
  });

  const { baseUrl, method, query } = request;
  if (!PropaneBaseRoutes.includes(baseUrl)) {
    return next(new ForbiddenError(`User does not have a permission`));
  }

  const permissions = get(subAdminDetails, 'subAdmin.role.permissions', undefined);
  if (!(permissions && permissions.length)) {
    return next(new ForbiddenError(`User does not have a permission`));
  }

  let moduleId = 0;
  for (const key of Object.keys(MapPropaneBaseRoutes)) {
    if ((get(MapPropaneBaseRoutes, key) || []).includes(baseUrl)) {
      moduleId = Number(key);
      break;
    }
  }

  if (!moduleId) return next();
  const permission = find(permissions, (prod) => prod.moduleId === moduleId);

  if (!permission) return next(new ForbiddenError(`User does not have a permission`));

  if (permission && !permission?.all) {
    let isAllow = true;
    switch (method) {
      case ApiMethods.GET:
        if (Object.keys(query).length !== 0 && !permission.view) {
          isAllow = false;
        } else if (Object.keys(query).length === 0 && !permission.index) {
          isAllow = false;
        }
        break;
      case ApiMethods.POST:
        if (!permission.add) isAllow = false;
        break;
      case ApiMethods.PUT:
        if (!permission.edit) isAllow = false;
        break;
      case ApiMethods.PATCH:
        if (!permission.edit) isAllow = false;
        break;
      case ApiMethods.DELETE:
        if (!permission.delete) isAllow = false;
        break;
      default:
        logger.error('No method found');
        break;
    }

    if (!isAllow) {
      return next(new ForbiddenError(`User does not have a permission`));
    }
  }
  return next();
};
