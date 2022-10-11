import { Request, Response, CookieOptions } from 'express';
import { getRepository, getCustomRepository, FindConditions, In } from 'typeorm';
import { Joi } from 'express-validation';
import randtoken from 'rand-token';

import { BadRequestError } from '../error';

import logger from '../service/log';
import { createOtp } from '../service/random';
// import { SmsService } from '../service/Sms';
import { MailService } from '../service/Mail';
import StripeCustomersService from '../service/StripeCustomers';
import { hashPassword, comparePassword } from '../service/password';

import { UsersRepository } from '../repository/Users';
import { TokensRepository } from '../repository/Tokens';
import { DriverDetailsRepository } from '../repository/DriverDetails';
import { UserVerificationDetailsRepository } from '../repository/UserVerifications';
import { Users } from '../model/Users';
import { UserOrderStatistics } from '../model/UserOrderStatistics';

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
/**
 * Title: SignUp API:
 * Created By: Sarang Patel;
 * steps:
 *    1) Manage find user condition according to the request parameters.
 *    2) Find user based on the conditions and if not found throw an error.
 *    3) After user created save the verifications(mobile + email) for the same user.
 *    4) Create and save user if userType is driver then also create driver_details and save it.
 *    5) Send sms and email for the verifications.
 *    6) Set the JWT tokens to manage the Auth flow.
 *    7) Provide tokens and user data as a response.
 */
export const signUp = () => async (req: Request, res: Response): Promise<void> => {
  const {
    body: {
      userType,
      email,
      password,
      countryCode,
      mobileNumber,
      fullName,
      orderType,
      zipcodeIds,
      deviceId,
      deviceType,
    },
  } = req;

  const userRepository = getCustomRepository(UsersRepository);
  const userVerificationRepo = getCustomRepository(UserVerificationDetailsRepository);
  const mobileOtp = createOtp().toString();
  const emailToken = randtoken.uid(32);

  const wherePhone: FindConditions<Users> = { countryCode, mobileNumber, userType };
  let isDriver = false;

  if (userType === PropaneUserType.DRIVER) isDriver = true;

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

  if (user && user.id) {
    const verificationTypes = [1, 2];
    verificationTypes.forEach(async (type: number) => {
      const newVerification = userVerificationRepo.create({
        type,
        verified: false,
        tokenOrOtp: type === 1 ? emailToken : mobileOtp,
        user,
      });
      await userVerificationRepo.save(newVerification);
    });
  }

  // Driver details if userType is Driver
  if (isDriver) {
    const driverReop = getCustomRepository(DriverDetailsRepository);
    let driver = driverReop.create({
      user,
      orderType,
      zipcodeIds,
    });

    driver = await driverReop.save(driver);
    user.driver = Object.assign({}, driver, { user: undefined });
  }

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

  // User Order Statistics
  const userOrderStatsRepo = getRepository(UserOrderStatistics);
  const userStats = userOrderStatsRepo.create({
    user,
  });
  await userOrderStatsRepo.save(userStats);

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

// TODO: replace all mail and sms send functions globally because it is used at more than one areas.
// const sendSms = async (user: Users, mobileOtp: string) => {
//   const smsService = new SmsService();
//   const smsBody = {
//     to: `${user?.countryCode}${user?.mobileNumber}`,
//     body: `Hello ${user?.fullName}, your mobile verification code is: ${mobileOtp}`,
//   };
//   await smsService.send(smsBody);
// };

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
/**
 * Title: Login API;
 * Created By: Sarang Patel;
 * steps:
 *    1) Manage find user condition according to the request parameters.
 *    2) Find user based on the given request parameters and select only id and password.
 *    3) If user not found throw an error.
 *    4) Check password and match it with current password if not matched then throw and error.
 *    5) create access and refresh tokens and then send it as a response.
 */
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

  // User Order Statistics
  const userOrderStatsRepo = getRepository(UserOrderStatistics);
  let userStats = await userOrderStatsRepo.findOne({ where: { user } });
  if (!userStats) {
    userStats = userOrderStatsRepo.create({
      user,
    });
    await userOrderStatsRepo.save(userStats);
  }

  // TODO: This may defer from token expiry
  const expiresIn = config.ACCESS_TOKEN_LIFETIME_MIN * 60;

  const cookieOptions: CookieOptions = {
    maxAge: expiresIn * 1000,
    secure: req.secure,
    httpOnly: true,
    sameSite: 'strict',
  };

  res
    .cookie('token', `Bearer ${accessToken}`, cookieOptions)
    .status(200)
    .json({
      token_type: 'bearer',
      access_token: accessToken,
      expires_in: expiresIn,
      refresh_token: refreshToken,
      is_address: user?.address?.length ? 1 : 0,
      is_driver_complete_profile: user?.driver?.isDriverProfileComplete(),
      is_vendor_password_reset: user?.vendor?.isResetPassword,
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
/**
 * Title: Refresh Token API;
 * Created By: Sarang Patel;
 * steps:
 *    1) Decode refreshToken which we get from the request if not found throw an error.
 *    2) If it's successfully ecoaded then find the user data based on the decoded response.
 *    3) Create new access_token from the current refresh_token and create new access_token based on that and that token send as a response.
 */
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

export const verifyOtpValidation = {
  body: Joi.object({
    otp: Joi.string().min(0).required(),
    countryCode: Joi.string().min(0).required(),
    mobileNumber: Joi.string().min(0).required(),
  }),
};
/**
 * Title: Verify Otp API;
 * Created By: Sarang Patel;
 * steps:
 *    1) Get the verification Details from the mobile, country_code and usertype.
 *    2) Filter that verification based on the type equals 2 (this is the otp verification type check verification model).
 *    3) Check if verification is available or not.
 *    4) Check if otp is matched or not if it isn't then throw an error accordingly.
 *    5) Set a status of 204 as a response.
 */
export const verifyOtp = () => async (req: Request, res: Response): Promise<void> => {
  const {
    body: { otp, countryCode, mobileNumber, userType },
  } = req;

  const userRepository = getCustomRepository(UsersRepository);
  const userVerificationRepo = getCustomRepository(UserVerificationDetailsRepository);
  const { verificationDetails } = await userRepository.findOneOrFail({
    where: { countryCode, mobileNumber, userType, isActive: 1 },
    withDeleted: false,
    relations: ['verificationDetails'],
  });

  const mobileVerification = (verificationDetails || []).find(
    (verification) => verification.type === 2,
  );

  if (!mobileVerification) {
    throw new BadRequestError('Verification is not Available', 'VERIFICATION_NOT_FOUND');
  }

  if (
    mobileVerification &&
    (mobileVerification?.tokenOrOtp === otp || mobileVerification?.tokenOrOtp === '1234') // TODO: Remove validation for the 1234 default otp.
  ) {
    mobileVerification.verified = true;
    await userVerificationRepo.save(mobileVerification);
  } else {
    throw new BadRequestError('Otp is invalid or expired', 'OTP_INVALID');
  }

  res.sendStatus(200);
};

export const resendOtpValidation = {
  body: Joi.object({
    countryCode: Joi.string().required(),
    mobileNumber: Joi.string().required(),
    userType: Joi.string().required(),
  }),
};
/**
 * Title: Resend Otp API;
 * Created By: Urvashi;
 * steps:
 *    1) Get the verification Details from the mobile, country_code and usertype.
 *    2) Filter that verification based on the type equals 2 (this is the otp verification type check verification model).
 *    3) Check if verification is available or not.
 *    4) Check if otp is matched or not if it isn't then throw an error accordingly.
 *    5) Set a status of 204 as a response.
 */
export const resendOtp = () => async (req: Request, res: Response): Promise<void> => {
  const {
    body: { countryCode, mobileNumber, userType },
  } = req;

  const userRepository = getCustomRepository(UsersRepository);
  const userVerificationRepo = getCustomRepository(UserVerificationDetailsRepository);

  // const { verificationDetails, ...users } = await userRepository.findOneOrFail({
  const { verificationDetails } = await userRepository.findOneOrFail({
    where: { countryCode, mobileNumber, userType, isActive: 1 },
    relations: ['verificationDetails'],
  });

  const mobileVerification = (verificationDetails || []).find(
    (verification) => verification.type === 2,
  );

  if (!mobileVerification) {
    throw new BadRequestError('Verification is not Available', 'VERIFICATION_NOT_FOUND');
  }

  if (mobileVerification.verified === true) {
    res.status(200).json({ message: 'Mobile number is already verified' });
  }
  const mobileOtp: string = (await createOtp()).toString();
  mobileVerification.tokenOrOtp = mobileOtp;
  await userVerificationRepo.save(mobileVerification);

  // TODO: send sms and email.
  // sendSms(users, mobileOtp);

  res.status(200).json({ message: 'Sms successfully sent' });
};
