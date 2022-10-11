import { getRepository, getCustomRepository, FindConditions, ILike } from 'typeorm';
import { Request, Response } from 'express';
import { Joi } from 'express-validation';

import ForgetPasswordService from '../service/ForgetPasswordService';
import UpdatePasswordService from '../service/UpdatePasswordService';
import { createOtp } from '../service/random';
import { SmsService } from '../service/Sms';
import { MailService } from '../service/Mail';
import { hashPassword, comparePassword } from '../service/password';
import { BadRequestError, UnauthorizedError } from '../error';
import { UsersRepository } from '../repository/Users';
import { VendorDetailsRepository } from '../repository/VendorDetails';
import { DriverDetailsRepository } from '../repository/DriverDetails';
import { SubAdminDetailsRepository } from '../repository/SubAdminDetails';
import { UserVerificationDetailsRepository } from '../repository/UserVerifications';
import { PropaneUserType } from '../constants';

import { Users } from '../model/Users';
import { VendorDetails } from '../model/VendorDetails';
import { UserVerificationDetails } from '../model/UserVerificationDetails';

import { ApiMessages } from '../api-message-constants';

export const getUsersValidation = {
  query: Joi.object({
    search: Joi.string().max(50),
    userType: Joi.string()
      .valid(...Object.values(PropaneUserType))
      .default(null),
    email: Joi.string().max(255).lowercase().email().default(null),
    page: Joi.number().integer().min(1).default(1),
    perPage: Joi.number().integer().min(1).max(40).default(20),
    sort: Joi.string().valid('ASC', 'DESC').default('DESC'),
    sortBy: Joi.string()
      .valid('fullName', 'email', 'status', 'createdAt', 'updatedAt')
      .default('createdAt'),
  }),
};

export const getAll = () => async (req: Request, res: Response): Promise<void> => {
  const {
    query: { search, userType, email, page, perPage, sort, sortBy },
  } = req;
  const usersRepository = getCustomRepository(UsersRepository);

  let where: FindConditions<Users> = {};

  if (search && search !== '') {
    where = { ...where, fullName: ILike(`%${search}%`) };
  }

  if (userType && userType !== '') {
    where = { ...where, userType: userType as string };
  }

  if (email) {
    where = { ...where, email: email as string };
  }

  const limit = Number(perPage);
  const offset = (Number(page) - 1) * limit;

  const [users, count] = await usersRepository.findAndCount({
    where,
    take: limit,
    skip: offset,
    order: { [sortBy as string]: sort },
  });

  res.status(200).json({ count, users });
};

export const getUsersByUserTypeValidation = {
  query: Joi.object({
    userType: Joi.string()
      .valid(...Object.values(PropaneUserType))
      .default(null),
  }),
};
export const getAllByUserType = () => async (req: Request, res: Response): Promise<void> => {
  const {
    query: { userType },
  } = req;
  const usersRepository = getCustomRepository(UsersRepository);

  let where: FindConditions<Users> = {};
  if (userType && userType !== '') {
    where = { ...where, userType: userType as string };
  }

  const [users, count] = await usersRepository.findAndCount({
    where,
    select: ['id', 'fullName'],
  });

  res.status(200).json({ count, users });
};

const namePattern = '^[A-za-z]';
export const createUserValidation = {
  body: Joi.object({
    fullName: Joi.string().max(255).regex(new RegExp(namePattern)).required(),
    email: Joi.string().max(255).lowercase().email().required(),
    password: Joi.string().min(6).max(128).required(), // TODO: May be 64
    userType: Joi.string()
      .valid(...Object.values(PropaneUserType))
      .required(),
  }),
};
export const createUser = () => async (req: Request, res: Response): Promise<void> => {
  const {
    body: { fullName, email, password, userType },
  } = req;

  const usersRepo = getRepository(Users);
  const existingUser = await usersRepo.findOne({ email, userType });

  if (existingUser) {
    throw new BadRequestError('Email address already used', 'EMAIL_ALREADY_EXIST');
  }

  const hashedPassword = await hashPassword(password);

  let user = usersRepo.create({
    fullName,
    email,
    password: hashedPassword,
    userType,
  });

  user = await usersRepo.save(user);
  const { password: _, ...userInfo } = user;

  res.status(201).json(userInfo);
};

export const avatar = () => async (req: Request, res: Response): Promise<void> => {
  const { user, file } = req;

  // TODO: Delete old s3 file
  // if (user.avatar) {
  //   await removeFile(join(mediaFolder, user.avatar));
  // }

  const usersRepo = getCustomRepository(UsersRepository);
  // await usersRepo.updateAvatar(user, getRelativePath(Media.USER, filename));
  // TODO: Give proper type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await usersRepo.updateAvatar(user, (<any>file)?.location);

  res.status(200).json(user);
};

export const changePasswordValidation = {
  body: Joi.object({
    oldPassword: Joi.string().min(6).max(128).required(),
    newPassword: Joi.string().min(6).max(128).required(),
  }),
};
/**
 * Title: Change Password API;
 * Created By: Sarang Patel;
 * steps:
 *    1) Get user data by the user.id which we receive from the access_token select only id and password.
 *    2) Check password is available or not and if it is then compare it with old password.
 *    3) If it's all matched then create new hashed password nad store it in the database.
 *    4) set message as a response.
 */
export const changePassword = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    body: { oldPassword, newPassword },
  } = req;

  const usersRepo = getRepository(Users);
  let relations: string[] = [];

  if (user?.userType === PropaneUserType.VENDOR) relations = [...relations, 'vendor'];

  const userWithPassword = await usersRepo.findOneOrFail(user.id, {
    select: ['id', 'password', 'isActive'],
    relations,
  });

  if (user && user?.vendor && !user?.vendor?.isResetPassword) {
    const vendorsRepo = getRepository(VendorDetails);
    await vendorsRepo.update(user?.vendor?.id || '', { isResetPassword: true });
  }

  if (userWithPassword.isActive === false) {
    throw new UnauthorizedError(ApiMessages.account_deactivate, '401');
  }

  const result = await comparePassword(oldPassword, userWithPassword.password);

  if (!result) {
    throw new BadRequestError(ApiMessages.incorrect_old_password, 'incorrect_old_password');
  }

  user.password = await hashPassword(newPassword);
  await usersRepo.save(user);

  res.status(200).json({ message: ApiMessages.password_change });
};

export const changeMobileNumberValidation = {
  body: Joi.object({
    mobileNumber: Joi.string().required(),
    countryCode: Joi.string().required(),
  }),
};
/**
 * Title: Change Mobile API;
 * Created By: Sarang Patel;
 * steps:
 *    1) Find user data based on the mobile and country_code.
 *    2) If user available then throw an error that user is already availale with the same obile and country_code.
 *    3) Then, Find verification of that user or Create verification if not.
 *    4) After that update mobile and country_code in the users table.
 *    5) Send Sms and set verification message as a response.
 */
export const changeMobileNumber = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    body: { mobileNumber, countryCode },
  } = req;

  const usersRepo = getRepository(Users);
  const userVerificationRepo = getRepository(UserVerificationDetails);

  const existingUser = await usersRepo.findOne({
    where: { mobileNumber, countryCode, userType: user.userType },
    withDeleted: false,
  });

  if (existingUser) {
    throw new BadRequestError(
      `User with mobile number: ${countryCode}${mobileNumber} already exist.`,
      'USER_ALREADY_EXIST',
    );
  }

  let verification = await userVerificationRepo.findOne({ user, type: 2 });
  const mobileOtp: string = (await createOtp()).toString();

  await usersRepo.update(user.id, { mobileNumber, countryCode });
  verification = Object.assign({}, verification, {
    user,
    type: 2,
    verified: false,
    tokenOrOtp: mobileOtp,
  });
  await userVerificationRepo.save(verification);

  const smsService = new SmsService();
  const smsBody = {
    to: `${user?.countryCode}${user?.mobileNumber}`,
    body: `Hello ${user?.fullName}, your mobile verification code is: ${mobileOtp}`,
  };

  await smsService.send(smsBody);

  res.status(200).json({ message: 'VERIFICATION_SENT_SUCCESS' });
};

export const getUserValidation = {
  params: Joi.object({ id: Joi.string().uuid({ version: 'uuidv4' }).required() }),
};
/**
 * Title: Get User by Id API;
 * Created By: Sarang Patel;
 * steps:
 *    1) Find user data based on the Id from the params with all relations.
 *    2) Remove password from the user data.
 */
export const getById = () => async (req: Request, res: Response): Promise<void> => {
  const {
    params: { id },
  } = req;

  const usersRepository = getCustomRepository(UsersRepository);
  let user = await usersRepository.find({
    where: { id },
    relations: ['vendor', 'driver', 'subAdmin', 'documents'],
  });

  user = Object.assign({}, ...user, { password: undefined });
  res.status(200).json(user);
};

// TODO: update based on the userType
export const updateUserValidation = {
  params: Joi.object({ id: Joi.string().uuid({ version: 'uuidv4' }).required() }),
  body: Joi.object({
    fullName: Joi.string().max(255).regex(new RegExp(namePattern)).optional(),
    email: Joi.string().max(255).lowercase().email().optional(),
    countryCode: Joi.string().optional(),
    mobileNumber: Joi.string().optional(),
    profileImage: Joi.string().optional(),
    orderType: Joi.number().optional(),
    zipcodeIds: Joi.string().optional(),
    personalId: Joi.string().optional(),
    idInformation: Joi.string().optional(),
    driverVehicle: Joi.string().optional(),
    vehicalNo: Joi.string().optional(),
    orderCapacity: Joi.number().min(0).optional(),
    address: Joi.string().optional(),
    licenceNo: Joi.string().optional(),
    licenceImage: Joi.string().optional(),
    isOnline: Joi.boolean().optional(),
    lowStockReminder: Joi.number().optional(),
    pageSize: Joi.number().optional(),
    isActive: Joi.boolean().optional(),
    adminAddress: Joi.string().optional(),
  }),
};
/**
 * Title: Update Profile API;
 * Created By: Sarang Patel;
 * steps:
 *    1) Find user data based on the params id with all available relations.
 *    2) Check email and countrycode or mobile Number is same as old user data if it isn't then manage verifications accordingly.
 *    3) Update basic user data in the users table.
 *    4) Now based on the userType update the data.
 *    5) Send 204 status code as a response.
 */
export const updateProfile = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { userType },
    body: {
      fullName,
      email,
      countryCode,
      mobileNumber,
      profileImage,
      zipcodeIds,
      lowStockReminder,
      isOnline,
      licenceNo,
      vehicalNo,
      driverVehicle,
      idInformation,
      orderCapacity,
      personalId,
      orderType,
      pageSize,
      isActive,
      address,
      licenceImage,
      adminAddress,
    },
    params: { id },
  } = req;

  const usersRepository = getCustomRepository(UsersRepository);
  const usersVerificationsRepository = getCustomRepository(UserVerificationDetailsRepository);

  const existingUser = await usersRepository.findByIdOrFail(id, {
    relations: ['vendor', 'driver', 'subAdmin', 'verificationDetails'],
  });

  let verification;

  if (email !== existingUser.email) {
    verification = (existingUser?.verificationDetails || []).find(
      (verification: UserVerificationDetails) => verification.type === 1,
    );
  }
  if (mobileNumber !== existingUser.mobileNumber || countryCode !== existingUser.countryCode) {
    verification = (existingUser?.verificationDetails || []).find(
      (verification: UserVerificationDetails) => verification.type === 2,
    );
  }

  if (verification && verification.id)
    await usersVerificationsRepository.update(verification.id, { verified: false });

  const userById = await usersRepository.findOneOrFail(id);
  if (fullName !== undefined) userById.fullName = fullName;
  if (email !== undefined) userById.email = email;
  if (countryCode !== undefined) userById.countryCode = countryCode;
  if (mobileNumber !== undefined) userById.mobileNumber = mobileNumber;
  if (profileImage !== undefined) userById.profileImage = profileImage;
  if (isActive !== undefined) userById.isActive = isActive;
  if (adminAddress !== undefined) userById.adminAddress = adminAddress;

  await usersRepository.save(userById);

  if (userType === PropaneUserType.VENDOR) {
    const { vendor } = existingUser;

    const vendorDetailsRepository = getCustomRepository(VendorDetailsRepository);

    if (zipcodeIds !== undefined) vendor.zipcodeIds = zipcodeIds;
    if (lowStockReminder !== undefined) vendor.lowStockReminder = lowStockReminder;

    await vendorDetailsRepository.save(vendor);
  } else if (userType === PropaneUserType.DRIVER) {
    const { driver } = existingUser;

    const driverDetailsRepository = getCustomRepository(DriverDetailsRepository);

    if (isOnline !== undefined) driver.isOnline = isOnline;
    if (licenceNo !== undefined) driver.licenceNo = licenceNo;
    if (licenceImage !== undefined) driver.licenceImage = licenceImage;
    if (orderCapacity !== undefined) driver.orderCapacity = orderCapacity;
    if (vehicalNo !== undefined) driver.vehicalNo = vehicalNo;
    if (driverVehicle !== undefined) driver.driverVehicle = driverVehicle;
    if (idInformation !== undefined) driver.idInformation = idInformation;
    if (personalId !== undefined) driver.personalId = personalId;
    if (orderType !== undefined) driver.orderType = orderType;
    if (address !== undefined) driver.address = address;

    await driverDetailsRepository.save(driver);
  } else if (userType === PropaneUserType.SUB_ADMIN) {
    const { subAdmin } = existingUser;
    const subAdminDetailsRepository = getCustomRepository(SubAdminDetailsRepository);

    if (pageSize !== undefined) subAdmin.pageSize = pageSize;
    await subAdminDetailsRepository.save(subAdmin);
  }

  res.sendStatus(204);
};

export const verifyOtpValidation = {
  body: Joi.object({
    userType: Joi.string().valid(...Object.values(PropaneUserType)),
    otp: Joi.string().required().default('1234'),
    type: Joi.number().required(),
    countryCode: Joi.string().required(),
    mobileNumber: Joi.string().required(),
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
    body: { otp, countryCode, mobileNumber, userType, type },
  } = req;

  const userRepository = getCustomRepository(UsersRepository);
  const userVerificationRepo = getCustomRepository(UserVerificationDetailsRepository);
  const users = await userRepository.findOneOrFail({
    where: { countryCode, mobileNumber, userType },
    relations: ['verificationDetails'],
  });

  if (type === 1) {
    const mobileVerification = users?.verificationDetails?.find(
      (verification) => verification.type === 2,
    );

    if (!mobileVerification) {
      throw new BadRequestError('Verification is not Available', 'VERIFICATION_NOT_FOUND');
    }

    // (mobileVerification?.tokenOrOtp === otp || mobileVerification?.tokenOrOtp === '1234')
    if (mobileVerification && otp === '1234') {
      mobileVerification.verified = true;
      await userVerificationRepo.save(mobileVerification);
    } else {
      throw new UnauthorizedError('Otp is invalid or expired', 'OTP_INVALID');
    }
  }
  if (type === 2) {
    const { otp: userOtp } = users;
    if (!(users && users.otp)) {
      throw new BadRequestError('OTP verification is not available', 'OTP_VERIFICATION_NOT_FOUND');
    }

    // TODO: update verifications when sms service is available
    // if (!(otpVerification && otpVerification === otp)) {
    //   throw new UnauthorizedError('OTP is invalid or expired', 'OTP_INVALID');
    // }

    if (!(otp === userOtp)) {
      throw new UnauthorizedError('OTP is invalid', 'OTP_INVALID');
    }
  }

  res.sendStatus(200);
};

export const verifyEmailValidation = {
  body: Joi.object({
    token: Joi.string().required(),
  }),
};
/**
 * Title: Verify Email API;
 * Created By: Sarang Patel;
 * steps:
 *    1) Get the verification Details from the token.
 *    2) Check if verification is available or not.
 *    3) If verification found then update verified is equal "true".
 *    4) Set a status of 200 as a response.
 */
export const verifyEmail = () => async (req: Request, res: Response): Promise<void> => {
  const {
    body: { token },
  } = req;

  const userVerificationRepository = getCustomRepository(UserVerificationDetailsRepository);
  const verificationDetails = await userVerificationRepository.findOne({
    where: { tokenOrOtp: token, type: 1 },
  });

  if (!verificationDetails) {
    throw new BadRequestError('Token is invalid or expired', 'INVALID_TOKEN');
  }

  await userVerificationRepository.update(verificationDetails.id, { verified: true });

  res.sendStatus(200);
};
/**
 * Title: Get Profile By Token;
 * Created By: Sarang Patel;
 */
export const profile = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { id },
  } = req;

  let userInfo = await getCustomRepository(UsersRepository).findOne({
    where: { id },
    relations: ['vendor', 'driver', 'subAdmin', 'verificationDetails', 'documents'],
  });

  userInfo = Object.assign({}, userInfo, { password: undefined });
  res.json(userInfo);
};

export const forgetPasswordValidation = {
  body: Joi.object({
    userType: Joi.string()
      .valid(...Object.values(PropaneUserType))
      .required(),
    countryCode: Joi.string().optional(),
    mobileNumber: Joi.string().optional(),
    email: Joi.string().lowercase().max(255).email().optional(),
  }),
};
/**
 * Title: Forget Password API;
 * Created By: Sarang Patel;
 * steps:
 *    1) Call Service of the ForgetPassword.
 *    Note: For the Detail Code of Service go to excecute method.
 */
export const forgetPassword = () => async (req: Request, res: Response): Promise<void> => {
  const service = new ForgetPasswordService();
  const result = await service.execute(req.body);

  res.json(result);
};

export const updatePasswordValidation = {
  body: Joi.object({
    token: Joi.string().optional(),
    otp: Joi.string().optional(),
    newPassword: Joi.string().min(6).max(128).required(),
    userType: Joi.string()
      .valid(...Object.values(PropaneUserType))
      .default(null)
      .required(),
  }),
};
/**
 * Title: Verify Email API;
 * Created By: Sarang Patel;
 * steps:
 *    1) Call Service of the UpdatePassword.
 *    Note: For the Detail Code of Service go to excecute method.
 */
export const updatePassword = () => async (req: Request, res: Response): Promise<void> => {
  const service = new UpdatePasswordService();
  const result = await service.execute(req.body);

  res.json(result);
};

export const resetPasswordValidation = {
  params: Joi.object({ id: Joi.string().uuid({ version: 'uuidv4' }).required() }),
  body: Joi.object({
    password: Joi.string().min(6).max(128).required(), // TODO: May be 64
  }),
};
/**
 * Title: Reset Password API;
 * Created By: Sarang Patel;
 * steps:
 *    1) Based on the Id find user data.
 *    2) Set the updated password(After converting it to Hashed) and save it to the users table.
 *    3) Set the response 200.
 */
export const resetPassword = () => async (req: Request, res: Response): Promise<void> => {
  const {
    params: { id },
    body: { password },
  } = req;

  const userRepository = getRepository(Users);
  const user = await userRepository.findOneOrFail(id);

  user.password = await hashPassword(password);
  await userRepository.save(user);

  res.sendStatus(200);
};

export const changeProfileStatusValidation = {
  body: Joi.object({
    userId: Joi.string().uuid({ version: 'uuidv4' }).required(),
    status: Joi.boolean().required(),
  }),
};
/**
 * Title: Change Password API;
 * Created By: Sarang Patel;
 * steps:
 *    1) Update status based on the userType for all users.
 *    2) Set the response 204.
 */
export const changeProfileStatus = () => async (req: Request, res: Response): Promise<void> => {
  const {
    body: { userId, status },
  } = req;

  const usersRepo = getRepository(Users);
  const existingUser = await usersRepo.findOne({
    where: { id: userId, userType: PropaneUserType.DRIVER },
    relations: ['driver', 'driver.vendor'],
  });
  if (!existingUser) {
    throw new BadRequestError('Driver not available', 'DRIVER_NOT_AVAILABLE');
  }

  // TODO: text will be differ according to the emailTemplates.
  const text = status ? 'profile_approval' : 'profile_rejected';

  await getCustomRepository(DriverDetailsRepository).update(
    { id: existingUser?.driver?.id, user: existingUser },
    { isApproved: status },
  );

  // TODO: uncomment send mail code.
  const mailService = new MailService();
  const mailBody = {
    text,
    to: existingUser?.email,
    subject: 'Profile',
    fullname: existingUser?.fullName,
    mobileNo: `${existingUser?.countryCode}${existingUser?.mobileNumber}`,
    actor: existingUser?.userType,
    email: existingUser?.email,
  };
  await mailService.send(mailBody);

  res.sendStatus(204);
};

export const changeUserStatusValidation = {
  body: Joi.object({
    userId: Joi.string().uuid({ version: 'uuidv4' }).required(),
    userType: Joi.string()
      .valid(...Object.values(PropaneUserType))
      .default(null),
    status: Joi.number().default(1),
  }),
};
/**
 * Title: Change Password API;
 * Created By: Sarang Patel;
 * steps:
 *    1) Update status based on the userType for all users.
 *    2) Set the response 204.
 */
export const changeUserStatus = () => async (req: Request, res: Response): Promise<void> => {
  const {
    body: { userId, userType, status },
  } = req;

  const usersRepo = getRepository(Users);
  let relations: string[] = [];

  if (userType === PropaneUserType.VENDOR) {
    relations = [...relations, 'vendor'];
  } else if (userType === PropaneUserType.DRIVER) {
    relations = [...relations, 'driver'];
  } else if (userType === PropaneUserType.SUB_ADMIN) {
    relations = [...relations, 'subAdmin'];
  }

  const existingUser = await usersRepo.findOneOrFail({
    where: { id: userId },
    relations,
  });

  const text = status ? 'activated' : 'inactivated';

  // TODO: update according
  if (userType === PropaneUserType.VENDOR) {
    await getCustomRepository(VendorDetailsRepository).update({ user: existingUser }, { status });
  } else if (userType === PropaneUserType.DRIVER) {
    await getCustomRepository(DriverDetailsRepository).update({ user: existingUser }, { status });
  } else if (userType === PropaneUserType.SUB_ADMIN) {
    await getCustomRepository(SubAdminDetailsRepository).update({ user: existingUser }, { status });
  }

  const mailService = new MailService();
  const mailBody = {
    text,
    subject: 'User Status',
    to: existingUser?.email,
    fullname: existingUser?.fullName,
    mobileNo: `${existingUser?.countryCode}${existingUser?.mobileNumber}`,
    actor: existingUser?.userType,
    email: existingUser?.email,
  };
  mailService.send(mailBody);

  res.sendStatus(204);
};
