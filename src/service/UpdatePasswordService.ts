import { getRepository } from 'typeorm';

import logger from './log';

import { hashPassword } from './password';
import { PropaneUserType, Token } from '../constants';

import { Users } from '../model/Users';
import { VendorDetails } from '../model/VendorDetails';

import { BadRequestError, UnauthorizedError } from '../error';
import { ITokenBase, verifyToken, isForgetPasswordToken } from '../service/token';

interface Request {
  token?: string;
  newPassword: string;
  otp?: string;
  userType?: string;
}

interface Response {
  message: string;
}

class UpdatePasswordService {
  private static instance: UpdatePasswordService;

  constructor() {
    if (UpdatePasswordService.instance instanceof UpdatePasswordService) {
      return UpdatePasswordService.instance;
    }
    UpdatePasswordService.instance = this;
  }

  public async execute(request: Request): Promise<Response> {
    const { token, newPassword: password, userType, otp } = request;

    const userRepository = getRepository(Users);

    let isMobileUser = false;
    let user;
    let decoded: ITokenBase;

    if (
      userType === PropaneUserType.VENDOR ||
      userType === PropaneUserType.DRIVER ||
      userType === PropaneUserType.USER
    )
      isMobileUser = true;

    if (isMobileUser) {
      user = await userRepository.findOne({
        where: {
          otp,
          userType,
        },
      });
    } else {
      try {
        decoded = await verifyToken(token || '', Token.FORGETPASSWORD);
        if (!isForgetPasswordToken(decoded)) {
          throw new BadRequestError('Provided token is not valid token', 'INVALID_TOKEN');
        }
        // TODO: remove any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        if (error?.name === 'TokenExpiredError') {
          throw new UnauthorizedError('Token is expired.', 'TOKEN_EXPIRED');
        }
        throw new BadRequestError('Provided token is not valid token', 'INVALID_TOKEN');
      }

      user = await userRepository.findOne({
        where: {
          id: decoded.sub,
        },
      });
    }

    // update isPasswordReset of the vendors
    if (user && user?.userType === PropaneUserType.VENDOR) {
      const vendorsRepo = getRepository(VendorDetails);
      const vendor = await vendorsRepo.findOne({ where: { user } });

      if (vendor && !vendor?.isResetPassword) {
        await vendorsRepo.save(Object.assign({}, vendor, { isResetPassword: true }));
      }
    }

    if (!user) {
      logger.error(`user does not exist with this token : [${token}]`);
      throw new BadRequestError('User does not exist', 'USER_DOES_NOT_EXIST');
    }

    user.password = await hashPassword(password);
    user.otp = null;
    await userRepository.save(user);

    const response: Response = {
      message: 'Password updated successfully',
    };

    return response;
  }
}

export default UpdatePasswordService;
