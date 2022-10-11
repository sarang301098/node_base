import {
  getRepository,
  getCustomRepository,
  FindConditions,
  ILike,
  getManager,
  Not,
} from 'typeorm';
import { Request, Response } from 'express';
import { Joi } from 'express-validation';

import { BadRequestError } from '../error';

import { UserAddressesRepository } from '../repository/UserAddresses';

import { ZipCodes } from '../model/ZipCodes';
import { UserAddresses } from '../model/UserAddress';

export const getUserAdressValidation = {
  query: Joi.object({
    search: Joi.string().optional().default(null),
    page: Joi.number().max(50).optional().default(1),
    perPage: Joi.number().max(50).optional().default(10),
  }),
};
export const getAll = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    query: { search, page, perPage },
  } = req;

  const userAddRepository = getCustomRepository(UserAddressesRepository);

  let where: FindConditions<UserAddresses> = { user };

  if (search && search !== '') {
    where = { ...where, fullName: ILike(`%${search}%`) };
  }

  const limit = Number(perPage);
  const offset = (Number(page) - 1) * limit;

  const [addresses, count] = await userAddRepository.findAndCount({
    where,
    take: limit,
    skip: offset,
  });

  res.status(200).json({ addresses, count });
};

const namePattern = '^[A-za-z]';
export const createAdressValidation = {
  body: Joi.object({
    fullName: Joi.string().max(255).regex(new RegExp(namePattern)).required(),
    state: Joi.string().max(255).regex(new RegExp(namePattern)).required(),
    countryCode: Joi.string().required(),
    phoneNumber: Joi.number().required(),
    county: Joi.string().max(255).regex(new RegExp(namePattern)).required(),
    city: Joi.string().max(255).regex(new RegExp(namePattern)).required(),
    country: Joi.string().max(255).regex(new RegExp(namePattern)).required(),
    addressType: Joi.string().required(),
    isDefault: Joi.boolean().required(),
    houseNo: Joi.string().required(),
    address: Joi.string().required(),
    lat: Joi.string().max(255).required(),
    long: Joi.string().max(255).required(),
    zipcodeId: Joi.number().optional(),
  }),
};
export const createAdress = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    body: {
      lat,
      city,
      long,
      state,
      county,
      fullName,
      country,
      houseNo,
      address,
      isDefault,
      addressType,
      countryCode,
      phoneNumber,
      zipcodeId,
    },
  } = req;

  const userAddressRepository = getCustomRepository(UserAddressesRepository);

  const existingAddress = await userAddressRepository.findOne({
    where: { lat, long, user },
  });

  if (existingAddress) {
    throw new BadRequestError('Address is already available', 'ADDRESS_ALREADY_AVAILABLE');
  }

  if (isDefault) {
    await userAddressRepository.update(
      {
        user,
      },
      { isDefault: false },
    );
  }

  let newAddress = userAddressRepository.create({
    lat,
    city,
    user,
    long,
    state,
    county,
    country,
    houseNo,
    address,
    fullName,
    isDefault,
    countryCode,
    phoneNumber,
    addressType,
    updatedBy: user?.id,
    createdBy: user?.id,
    zipCode: zipcodeId && (await getRepository(ZipCodes).findOne({ where: { id: zipcodeId } })),
  });

  newAddress = await userAddressRepository.save(newAddress);

  // filter
  newAddress = Object.assign({}, newAddress, { zipCode: undefined, user: undefined });
  res.status(200).json(newAddress);
};

export const updateAdressValidation = {
  body: Joi.object({
    fullName: Joi.string().max(255).regex(new RegExp(namePattern)).optional(),
    state: Joi.string().max(255).regex(new RegExp(namePattern)).optional(),
    countryCode: Joi.string().optional(),
    phoneNumber: Joi.number().optional(),
    county: Joi.string().max(255).regex(new RegExp(namePattern)).optional(),
    city: Joi.string().max(255).regex(new RegExp(namePattern)).optional(),
    country: Joi.string().max(255).regex(new RegExp(namePattern)).optional(),
    addressType: Joi.string().optional(),
    isDefault: Joi.boolean().optional(),
    houseNo: Joi.string().optional(),
    address: Joi.string().optional(),
    lat: Joi.string().max(255).optional(),
    long: Joi.string().max(255).optional(),
    zipcodeId: Joi.number().integer().min(1).optional(),
  }),
  params: Joi.object({
    id: Joi.number().integer().min(1).required(),
  }),
};
export const updateAdress = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    body: {
      fullName,
      state,
      countryCode,
      phoneNumber,
      county,
      city,
      country,
      addressType,
      isDefault,
      houseNo,
      address,
      lat,
      long,
      zipcodeId,
    },
    params: { id },
  } = req;

  const userAddressRepository = getCustomRepository(UserAddressesRepository);
  const zipcodeRepository = getRepository(ZipCodes);

  const existingAddress = await userAddressRepository.findOne({
    where: { id: Not(id), lat, long, user },
    relations: ['zipCode'],
    select: ['id', 'zipCode'],
  });

  if (existingAddress) {
    throw new BadRequestError('Address is already available', 'ADDRESS_ALREADY_AVAILABLE');
  }

  if (isDefault) {
    await userAddressRepository.update(
      {
        user,
      },
      { isDefault: false },
    );
  }

  const userAddressById = await userAddressRepository.findOneOrFail(id);

  if (lat !== undefined) userAddressById.lat = lat;
  if (long !== undefined) userAddressById.long = long;
  if (city !== undefined) userAddressById.city = city;
  if (state !== undefined) userAddressById.state = state;
  if (county !== undefined) userAddressById.county = county;
  if (address !== undefined) userAddressById.address = address;
  if (country !== undefined) userAddressById.country = country;
  if (houseNo !== undefined) userAddressById.houseNo = houseNo;
  if (fullName !== undefined) userAddressById.fullName = fullName;
  if (isDefault !== undefined) userAddressById.isDefault = isDefault;
  if (countryCode !== undefined) userAddressById.countryCode = countryCode;
  if (phoneNumber !== undefined) userAddressById.phoneNumber = phoneNumber;
  if (addressType !== undefined) userAddressById.addressType = addressType;
  // TODO: Update if not matched to the current zipcode data in the address.
  if (zipcodeId !== undefined)
    userAddressById.zipCode = await zipcodeRepository.findOneOrFail({ where: { id: zipcodeId } });

  await userAddressRepository.save(userAddressById);
  res.sendStatus(204);
};

export const getByIdAddressValidation = {
  params: Joi.object({ id: Joi.number().integer().min(1).required() }),
};
export const getByIdAddress = () => async (req: Request, res: Response): Promise<void> => {
  const {
    params: { id },
  } = req;

  const userAddressRepository = getCustomRepository(UserAddressesRepository);

  const address = await userAddressRepository.findOne({ where: { id } });

  res.json({ ...address });
};

export const deleteAddressValidation = {
  params: Joi.object({ id: Joi.number().integer().min(1).required() }),
};
export const removeAddress = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { id: userId },
    params: { id },
  } = req;

  await getManager().transaction(async (em) => {
    await em.update(UserAddresses, { id }, { updatedBy: userId });
    await em.softDelete(UserAddresses, id);
  });

  res.sendStatus(204);
};
