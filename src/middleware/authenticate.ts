import { RequestHandler } from 'express';
import { getRepository } from 'typeorm';

import { handelPermission } from './handle-permissions';
import { UnauthorizedError, BadRequestError } from '../error';
import { verifyToken, isAccessToken } from '../service/token';
import { getAuthCookie } from '../utils/cookie';

import { Token, PropaneUserType } from '../constants';

import { Users } from '../model/Users';

export const authenticate: RequestHandler = async (request, response, next): Promise<void> => {
  const authHeader = request.headers.authorization;
  const authCookie = getAuthCookie(request.headers.cookie as string);

  if (!authHeader && !authCookie) {
    return next(new UnauthorizedError('JWT token is missing', 'TOKEN_MISSING'));
  }

  const [, token] = (authCookie ?? authHeader ?? '').split(' ');

  try {
    const decoded = await verifyToken(token, Token.ACCESS);

    if (!isAccessToken(decoded)) {
      throw new BadRequestError('Provided token is not valid access token', 'INVALID_ACCESS_TOKEN');
    }

    const { sub } = decoded;

    const usersRepo = getRepository(Users);
    const user = await usersRepo.findOne({ where: { id: sub }, relations: ['token'] });

    if (!user) {
      return next(new UnauthorizedError('User do not exist'));
    }

    // check only for the mobile users
    // TODO: Handle multi tokens for multi-device login.
    if (
      user &&
      user?.userType === (PropaneUserType.USER || PropaneUserType.DRIVER || PropaneUserType.VENDOR)
    ) {
      if (!(user?.token && user?.token?.accessToken === token)) {
        return next(
          new UnauthorizedError('Provided token is not valid access token', 'INVALID_ACCESS_TOKEN'),
        );
      }
    }

    request.user = user;
    request.token = token;
    if (user?.userType === PropaneUserType.SUB_ADMIN) {
      return handelPermission(request, response, next);
    }

    return next();
  } catch (err) {
    return next(new UnauthorizedError('Invalid JWT token', 'INVALID_TOKEN'));
  }
};
