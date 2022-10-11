import {
  getRepository,
  getCustomRepository,
  FindConditions,
  ILike,
  getManager,
  Not,
  In,
} from 'typeorm';
import { Request, Response } from 'express';
import { Joi } from 'express-validation';
import randtoken from 'rand-token';

import { BadRequestError } from '../error';

import config from '../config';
import { PropaneUserType } from '../constants';

import { MailService } from '../service/Mail';
import { generateKey } from '../utils/random';
import { hashPassword } from '../service/password';
import { UsersRepository } from '../repository/Users';
import { SubAdminDetailsRepository } from '../repository/SubAdminDetails';

import { Users } from '../model/Users';
import { Roles } from '../model/Roles';
import { SubAdminDetails } from '../model/SubAdminDetails';
import { UserVerificationDetails } from '../model/UserVerificationDetails';

export const getSubAdminsUserValidation = {
  query: Joi.object({
    search: Joi.string().alphanum().default(null),
    page: Joi.number().integer().min(1).default(1),
    perPage: Joi.number().integer().min(1).default(10),
    sortBy: Joi.string().default('fullName'),
    sort: Joi.string().valid('ASC', 'DESC').default('ASC'),
  }),
};
export const getAll = () => async (req: Request, res: Response): Promise<void> => {
  const {
    query: { search, page, perPage, sort, sortBy },
  } = req;

  const subAdminsRepository = getCustomRepository(UsersRepository);
  let where: FindConditions<Users> = { userType: PropaneUserType.SUB_ADMIN };

  if (search && search !== null) {
    where = { ...where, fullName: ILike(`%${search}%`) };
  }

  const limit = Number(perPage);
  const offset = (Number(page) - 1) * limit;

  const [subAdmin, count] = await subAdminsRepository.findAndCount({
    where,
    take: limit,
    skip: offset,
    order: { [sortBy as string]: sort },
    select: ['id', 'fullName', 'isActive', 'countryCode', 'mobileNumber', 'profileImage', 'email'],
  });

  res.status(200).json({ count, subAdmin });
};

export const getByIdSubAdminValidation = {
  params: Joi.object({ id: Joi.string().uuid({ version: 'uuidv4' }).required() }),
};
export const getById = () => async (req: Request, res: Response): Promise<void> => {
  const {
    params: { id },
  } = req;

  const userRepository = getRepository(Users);
  const subAdmin = await userRepository.findOne({
    where: { id, userType: PropaneUserType.SUB_ADMIN },
    relations: ['subAdmin', 'subAdmin.role'],
  });

  res.status(200).json(subAdmin);
};

const namePattern = '^[A-za-z]';
export const createSubAdminDetailsValidation = {
  body: Joi.object({
    status: Joi.boolean().required(),
    roleId: Joi.number().integer().min(1).required(),
    countryCode: Joi.string().max(5).required(),
    mobileNumber: Joi.string().max(15).required(),
    email: Joi.string().max(255).lowercase().email().required(),
    fullName: Joi.string().max(255).regex(new RegExp(namePattern)).required(),
  }),
};
export const createSubAdminDetails = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    body: { fullName, email, mobileNumber, countryCode, roleId, status },
  } = req;

  const usersRepository = getRepository(Users);
  const rolesRepository = getRepository(Roles);
  const subAdminsRepository = getRepository(SubAdminDetails);
  const userVerificationRepo = getRepository(UserVerificationDetails);

  const emailToken = randtoken.uid(32);
  const password = generateKey(4);
  const link = `${config.FRONTEND_BASE_URL}${config.FRONTEND_VERIFY_EMAIL_URL}?token=${emailToken}`;

  // Check with only email
  const existingUserWithEmail = await usersRepository.findOne({
    where: {
      email,
      userType: In([PropaneUserType.SUB_ADMIN, PropaneUserType.ADMIN, PropaneUserType.SUPER_ADMIN]),
    },
  });

  if (existingUserWithEmail)
    throw new BadRequestError('Email address already exist', 'USER_ALREADY_EXIST');

  // Check with email, countrycode, and mobile number
  const existingUser = await usersRepository.findOne({
    where: {
      email,
      countryCode,
      mobileNumber,
      userType: In([PropaneUserType.SUB_ADMIN, PropaneUserType.ADMIN, PropaneUserType.SUPER_ADMIN]),
    },
  });

  if (existingUser) throw new BadRequestError('User is already available', 'USER_ALREADY_EXIST');

  const role = await rolesRepository.findOne(roleId);
  if (!role) throw new BadRequestError('Role is not available', 'ROLE_NOT_AVAILABLE');

  const hashedPassword = await hashPassword(password);
  let userData = usersRepository.create({
    email,
    fullName,
    countryCode,
    mobileNumber,
    isActive: status,
    password: hashedPassword,
    userType: PropaneUserType.SUB_ADMIN,
  });

  userData = await usersRepository.save(userData);
  let subAdminDetail = subAdminsRepository.create({
    role,
    status: 1,
    user: userData,
    createdBy: user?.id,
    updatedBy: user?.id,
  });
  subAdminDetail = await subAdminsRepository.save(subAdminDetail);

  if (userData && userData.id) {
    const verificationTypes = [1, 2];
    verificationTypes.forEach(async (type: number) => {
      const newVerification = userVerificationRepo.create({
        type,
        user: userData,
        verified: type !== 1,
        tokenOrOtp: type === 1 ? emailToken : null,
      });
      await userVerificationRepo.save(newVerification);
    });
  }

  const mailService = new MailService();
  const mailBody = {
    link,
    email,
    password,
    to: email,
    name: fullName,
    subject: 'Sub Admin Login Details',
    text: 'subadmin_registration',
  };
  mailService.send(mailBody);
  res.status(201).json(subAdminDetail);
};

export const updateSubAdminDetailsValidation = {
  params: Joi.object({ id: Joi.string().uuid({ version: 'uuidv4' }).required() }),
  body: Joi.object({
    fullName: Joi.string().max(255).regex(new RegExp(namePattern)).required(),
    email: Joi.string().lowercase().max(255).email().required(),
    countryCode: Joi.string().max(5).required(),
    mobileNumber: Joi.string().max(15).required(),
    roleId: Joi.number().integer().min(0).required(),
    status: Joi.boolean().required(),
  }),
};
export const updateSubAdminDetails = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { id: userId },
    body: { fullName, email, mobileNumber, countryCode, roleId, status },
    params: { id },
  } = req;

  const usersRepository = getCustomRepository(UsersRepository);
  const existingUser = await usersRepository.findOne({
    where: { email, id: Not(id), userType: In(['sub_admin', 'admin']) },
  });
  if (existingUser) {
    throw new BadRequestError(`User with email: ${email} already exist`, 'USER_ALREADY_EXIST');
  }

  // TODO: Update validation based on the current values.
  // const subAdmin = await usersRepository.findOne({
  //   where: { id, userType: In(['sub_admin', 'admin']) },
  //   relations: ['subAdmin', 'subAdmin.role'],
  // });

  const role = await getManager().getRepository(Roles).findOne(roleId);
  if (!role) {
    throw new BadRequestError('Role is not found', 'ROLE_NOT_FOUND');
  }

  await usersRepository.update(id, {
    email,
    fullName,
    countryCode,
    mobileNumber,
    isActive: status,
  });

  const subAdminsRepository = getCustomRepository(SubAdminDetailsRepository);
  await subAdminsRepository.update(
    { user: await usersRepository.findOne(id) },
    {
      role,
      status,
      updatedBy: userId,
    },
  );

  res.sendStatus(204);
};

export const deleteSubAdminDetailsValidation = {
  params: Joi.object({ id: Joi.string().uuid({ version: 'uuidv4' }).required() }),
};
export const removeSubAdminDetails = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { id: userId },
    params: { id },
  } = req;

  const userRepository = getCustomRepository(UsersRepository);
  const user = await userRepository.findOneOrFail(id);

  await getManager().transaction(async (em) => {
    await em.update(Users, { id }, { updatedBy: userId });
    await em.softDelete(Users, id);
    await em.update(SubAdminDetails, { user }, { updatedBy: userId });
    await em.softDelete(SubAdminDetails, { user });
  });

  res.sendStatus(204);
};

export const updateSubAdminStatusValidation = {
  params: Joi.object({ id: Joi.string().uuid({ version: 'uuidv4' }).required() }),

  body: Joi.object({
    status: Joi.number().required(),
  }),
};

export const updateSubAdminStaus = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { id: userId },
    body: { status },
    params: { id },
  } = req;

  const usersRepository = getCustomRepository(UsersRepository);

  await usersRepository.update(id, {
    isActive: status,
  });

  const subAdminsRepository = getCustomRepository(SubAdminDetailsRepository);
  await subAdminsRepository.update(
    { user: await usersRepository.findOne(id) },
    {
      status,
      updatedBy: userId,
    },
  );

  res.sendStatus(204);
};
