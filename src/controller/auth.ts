import { Request, Response, CookieOptions } from 'express';
import { getCustomRepository, FindConditions, In } from 'typeorm';
import { Joi } from 'express-validation';
import randtoken from 'rand-token';

import { BadRequestError } from '../error';

import logger from '../service/log';
import { MailService } from '../service/Mail';
import StripeCustomersService from '../service/StripeCustomers';
import { hashPassword, comparePassword } from '../service/password';

import { UsersRepository } from '../repository/Users';
import { TokensRepository } from '../repository/Tokens';
import { Users } from '../model/Users';

import { PropaneUserType, Token, Actions } from '../constants';
import { ApiMessages } from '../api-message-constants';
import config from '../config';

import {
  ITokenBase,
  verifyToken,
  isRefreshToken,
  signAccessToken,
  signRefreshToken,
} from '../service/token';

const namePattern = '^[A-za-z]';
export const signupValidation = {
  body: Joi.object({
    email: Joi.string().lowercase().max(255).email().required(),
    fullName: Joi.string().max(255).regex(new RegExp(namePattern)).required(),
    password: Joi.string().min(6).max(128).required(),
    userType: Joi.string()
      .valid(...Object.values(PropaneUserType))
      .required(),
    countryCode: Joi.string().max(5).required(),
    mobileNumber: Joi.string().max(15).required(),
    orderType: Joi.number().optional(),
    zipcodeIds: Joi.array().items(Joi.number().optional()).default(null),
    deviceId: Joi.string().optional(),
    deviceType: Joi.string().optional(),
  }),
};
export const signUp = () => async (req: Request, res: Response): Promise<void> => {
  const {
    body: { userType, email, password, countryCode, mobileNumber, fullName, deviceId, deviceType },
  } = req;

  const userRepository = getCustomRepository(UsersRepository);
  const emailToken = randtoken.uid(32);

  const wherePhone: FindConditions<Users> = { countryCode, mobileNumber, userType };

  const existingUserPhone = await userRepository.findOne(wherePhone);
  if (existingUserPhone) {
    throw new BadRequestError(ApiMessages.phone_exist_already, 'PHONE_ALREADY_EXIST');
  }

  const whereEmail: FindConditions<Users> = { email, userType };
  const existingUserEmail = await userRepository.findOne(whereEmail);
  if (existingUserEmail) {
    throw new BadRequestError(ApiMessages.email_exist_already, 'Email_ALREADY_EXIST');
  }

  const hashedPassword = await hashPassword(password);

  let user = userRepository.create({
    fullName,
    email,
    password: hashedPassword,
    userType,
    countryCode,
    mobileNumber,
  });

  user = await userRepository.save(user);

  const link = `${config.FRONTEND_BASE_URL}${config.FRONTEND_VERIFY_EMAIL_URL}?token=${emailToken}`;
  // TODO: send sms and email.
  // sendSms(user, mobileOtp);

  try {
    sendMail(user, link);
  } catch (error) {
    logger.error('Error in mail sent');
  }

  if (user && user.password) user.password = '';

  if (
    !user?.stripeCustomerId &&
    !(user?.userType === PropaneUserType.ADMIN || user?.userType === PropaneUserType.SUB_ADMIN)
  ) {
    try {
      const service = new StripeCustomersService();
      const result = await service.execute({
        userId: user?.id,
        email: user?.email,
        name: user?.fullName,
        action: Actions.CREATE,
      });
      await userRepository.update(user?.id, { stripeCustomerId: result?.stripeCustomerId });
    } catch (error) {
      logger.error('Error in creation of stripe customer');
    }
  }

  const accessToken = await signAccessToken(user.id);
  const refreshToken = await signRefreshToken(user.id);

  // handle Token through our Database and JWT.
  if (
    accessToken &&
    refreshToken &&
    userType === (PropaneUserType.USER || PropaneUserType.VENDOR || PropaneUserType.DRIVER)
  ) {
    const tokensRepository = getCustomRepository(TokensRepository);
    const tokens = tokensRepository.create({
      user,
      deviceId,
      deviceType,
      accessToken,
      refreshToken,
      loginCount: 1,
      lastLogin: new Date(),
    });
    await tokensRepository.save(tokens);
  }

  // TODO: This may defer from token expiry
  const expiresIn = config.ACCESS_TOKEN_LIFETIME_MIN * 60;

  const cookieOptions: CookieOptions = {
    maxAge: expiresIn * 1000,
    secure: req.secure,
    httpOnly: true,
    sameSite: 'strict',
  };

  res.cookie('token', `Bearer ${accessToken}`, cookieOptions).status(200).json({
    token_type: 'bearer',
    access_token: accessToken,
    expires_in: expiresIn,
    refresh_token: refreshToken,
    user,
  });
};

const sendMail = async (user: Users, link: string) => {
  const mailService = new MailService();
  const mailBody = {
    link,
    text: 'email_verify',
    to: user.email,
    fullname: user.fullName,
    mobileNo: `${user.countryCode}${user.mobileNumber}`,
    actor: user.userType,
    email: user.email,
  };
  await mailService.send(mailBody);
};

export const loginValidation = {
  body: Joi.object({
    email: Joi.string().lowercase().max(255).email().optional(),
    password: Joi.string().min(6).max(128).required(),
    userType: Joi.string()
      .valid(...Object.values(PropaneUserType))
      .optional(),
    countryCode: Joi.string().optional(),
    mobileNumber: Joi.string().optional(),
    deviceId: Joi.string().optional(),
    deviceType: Joi.string().optional(),
  }),
};
export const login = () => async (req: Request, res: Response): Promise<void> => {
  const {
    body: { userType, email, password, countryCode, mobileNumber, deviceId, deviceType },
  } = req;

  const userRepository = getCustomRepository(UsersRepository);
  let where: FindConditions<Users> = {};
  let relations: string[] = ['address'];
  let isSms = false;

  if (
    userType === PropaneUserType.VENDOR ||
    userType === PropaneUserType.DRIVER ||
    userType === PropaneUserType.USER
  ) {
    relations = [...relations, 'token'];
    isSms = true;
    if (userType === PropaneUserType.VENDOR) {
      relations = [...relations, 'vendor'];
    } else if (userType === PropaneUserType.DRIVER) {
      relations = [...relations, 'driver'];
    } else if (userType === PropaneUserType.SUB_ADMIN) {
      relations = [...relations, 'subAdmin'];
    }
  }

  if (isSms) where = { ...where, countryCode, mobileNumber, userType };
  else
    where = { ...where, email, userType: In([PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN]) };

  const user = await userRepository.findOne(where, {
    relations,
    select: ['id', 'password', 'isActive', 'deletedAt', 'stripeCustomerId'],
  });

  if (!user) {
    throw new BadRequestError(ApiMessages.invalid_login_2, 'USER_NOT_FOUND');
  }

  if (user && !user.isActive) {
    throw new BadRequestError(ApiMessages.account_deactivated, 'INACTIVE_USER');
  }

  if (user.isActive === false) {
    throw new BadRequestError(ApiMessages.account_deactivate, 'ACCOUNT_DEACTIVATED');
  }

  if (user.deletedAt != null) {
    throw new BadRequestError(ApiMessages.account_deleted_message, 'ACCOUNT_IS_DELETED');
  }

  if (
    !user?.stripeCustomerId &&
    !(user?.userType === PropaneUserType.ADMIN || user?.userType === PropaneUserType.SUB_ADMIN)
  ) {
    try {
      const service = new StripeCustomersService();
      const result = await service.execute({
        userId: user?.id,
        email: user?.email,
        name: user?.fullName,
        action: Actions.CREATE,
      });
      await userRepository.update(user?.id, { stripeCustomerId: result?.stripeCustomerId });
    } catch (error) {
      logger.error(
        `Error in generate the stripe customer \n for user id: ${user?.id}, fullName: ${user?.fullName}`,
      );
    }
  }

  const passwordMatched = await comparePassword(password, user.password);
  if (!passwordMatched) {
    throw new BadRequestError(ApiMessages.invalid_login_2, 'PASSWORD_MISSMATCH');
  }

  const accessToken = await signAccessToken(user.id);
  const refreshToken = await signRefreshToken(user.id);

  if (
    accessToken &&
    refreshToken &&
    userType === (PropaneUserType.USER || PropaneUserType.VENDOR || PropaneUserType.DRIVER)
  ) {
    const tokensRepository = getCustomRepository(TokensRepository);
    if (user?.token && user?.token?.id) {
      await tokensRepository.update(user?.token?.id, {
        deviceId,
        deviceType,
        accessToken,
        refreshToken,
        lastLogin: new Date(),
        loginCount: (user?.token?.loginCount || 0) + 1,
      });
    } else {
      const tokens = tokensRepository.create({
        user,
        deviceId,
        deviceType,
        accessToken,
        refreshToken,
        loginCount: 1,
        lastLogin: new Date(),
      });
      await tokensRepository.save(tokens);
    }
  }

  // TODO: This may defer from token expiry
  const expiresIn = config.ACCESS_TOKEN_LIFETIME_MIN * 60;

  const cookieOptions: CookieOptions = {
    maxAge: expiresIn * 1000,
    secure: req.secure,
    httpOnly: true,
    sameSite: 'strict',
  };

  res.cookie('token', `Bearer ${accessToken}`, cookieOptions).status(200).json({
    token_type: 'bearer',
    access_token: accessToken,
    expires_in: expiresIn,
    refresh_token: refreshToken,
  });
};

/**
 * Refresh token Validation
 */
export const refreshTokenValidation = {
  body: Joi.object({
    refreshToken: Joi.string().required(),
  }),
};
export const refreshToken = () => async (req: Request, res: Response): Promise<void> => {
  const {
    body: { refreshToken },
  } = req;

  let decoded: ITokenBase;
  try {
    decoded = await verifyToken(refreshToken, Token.REFRESH);
    if (!isRefreshToken(decoded)) {
      throw new BadRequestError(
        'Provided token is not valid refresh token',
        'INVALID_REFRESH_TOKEN',
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error?.name === 'TokenExpiredError') {
      throw new BadRequestError('Refresh token expired.', 'REFRESH_TOKEN_EXPIRED');
    }
    throw new BadRequestError('Provided token is not valid refresh token', 'INVALID_REFRESH_TOKEN');
  }

  const userRepository = getCustomRepository(UsersRepository);

  // TODO: Use findOneOrFail with custom error
  const user = await userRepository.findOneOrFail(decoded.sub);

  if (!user) {
    throw new BadRequestError('Incorrect credentials.');
  }

  const accessToken = await signAccessToken(user.id);
  const newRefreshToken = await signRefreshToken(user.id);

  if (
    accessToken &&
    refreshToken &&
    newRefreshToken &&
    user?.userType === (PropaneUserType.USER || PropaneUserType.VENDOR || PropaneUserType.DRIVER)
  ) {
    const tokensRepository = getCustomRepository(TokensRepository);
    const token = await tokensRepository.getByUserId(user.id);

    if (!token || token?.refreshToken !== refreshToken) {
      throw new BadRequestError('Invalid token');
    }
    await tokensRepository.save(
      Object.assign({}, token, { accessToken, refreshToken: newRefreshToken }),
    );
  }

  // TODO: This may defer from token expiry
  const expiresIn = config.ACCESS_TOKEN_LIFETIME_MIN * 60;

  const cookieOptions: CookieOptions = {
    maxAge: expiresIn * 1000,
    secure: req.secure,
    httpOnly: true,
    sameSite: 'strict',
  };

  res.cookie('token', `Bearer ${accessToken}`, cookieOptions).status(200).json({
    token_type: 'bearer',
    access_token: accessToken,
    expires_in: expiresIn,
    refresh_token: newRefreshToken,
  });
};
