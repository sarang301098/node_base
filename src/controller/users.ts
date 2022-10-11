import { getRepository, getCustomRepository, FindConditions, ILike } from 'typeorm';
import { Request, Response } from 'express';
import { Joi } from 'express-validation';

import ForgetPasswordService from '../service/ForgetPasswordService';
import UpdatePasswordService from '../service/UpdatePasswordService';
import { hashPassword, comparePassword } from '../service/password';
import { BadRequestError, UnauthorizedError } from '../error';
import { UsersRepository } from '../repository/Users';
import { PropaneUserType } from '../constants';

import { Users } from '../model/Users';

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
export const changeMobileNumber = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    body: { mobileNumber, countryCode },
  } = req;

  const usersRepo = getRepository(Users);

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

  res.status(200).json({ message: 'VERIFICATION_SENT_SUCCESS' });
};

export const getUserValidation = {
  params: Joi.object({ id: Joi.string().uuid({ version: 'uuidv4' }).required() }),
};
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
export const updateProfile = () => async (req: Request, res: Response): Promise<void> => {
  const {
    body: { fullName, email, countryCode, mobileNumber, profileImage, isActive, adminAddress },
    params: { id },
  } = req;

  const usersRepository = getCustomRepository(UsersRepository);

  const userById = await usersRepository.findOneOrFail(id);
  if (fullName !== undefined) userById.fullName = fullName;
  if (email !== undefined) userById.email = email;
  if (countryCode !== undefined) userById.countryCode = countryCode;
  if (mobileNumber !== undefined) userById.mobileNumber = mobileNumber;
  if (profileImage !== undefined) userById.profileImage = profileImage;
  if (isActive !== undefined) userById.isActive = isActive;
  if (adminAddress !== undefined) userById.adminAddress = adminAddress;

  res.sendStatus(204);
};

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
