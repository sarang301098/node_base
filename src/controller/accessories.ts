import {
  getManager,
  getRepository,
  getCustomRepository,
  FindConditions,
  ILike,
  Not,
} from 'typeorm';
import { Request, Response } from 'express';
import { Joi } from 'express-validation';

import { BadRequestError } from '../error';
import { AccessoriesRepository } from '../repository/Accessories';

import { Accessories } from '../model/Accessory';

type ISerachObject = {
  where?: FindConditions<Accessories>;
  take?: number;
  skip?: number;
};

export const getAccessoriesValidation = {
  query: Joi.object({
    search: Joi.string().max(50).optional().allow('').default(null),
    page: Joi.number().integer().min(1).default(1),
    perPage: Joi.number().integer().min(1).default(10),
    isFilters: Joi.boolean().default(true),
  }),
};
/**
 * Title: Accessory List API;
 * Created By: Sarang Patel;
 * steps:
 *    1) Manage searchObject according to the request params.
 *    2) fetch list and send it as a reponse.
 */
export const getAll = () => async (req: Request, res: Response): Promise<void> => {
  const {
    query: { search, page, perPage, isFilters },
  } = req;
  const accessoryRepository = getCustomRepository(AccessoriesRepository);
  let searchObject: ISerachObject = {};

  let where: FindConditions<Accessories> = {};

  if (search && search !== '') {
    where = { ...where, name: ILike(`%${search}%`) };
  }

  const limit = Number(perPage);
  const offset = (Number(page) - 1) * limit;

  if (isFilters) {
    searchObject = {
      where,
      take: limit,
      skip: offset,
    };
  }

  const [accessories, count] = await accessoryRepository.findAndCount(searchObject);

  res.status(200).json({ count, accessories });
};

const namePattern = '^[A-za-z]';
export const createAccessoryValidation = {
  body: Joi.object({
    name: Joi.string().max(255).regex(new RegExp(namePattern)).required(),
    image: Joi.string().min(1),
    price: Joi.number().default(0),
    description: Joi.string().min(1),
  }),
};
/**
 * Title: Create Accessory API;
 * Created By: Sarang Patel;
 * steps:
 *    1) Check if the accessory is available or not .
 *    2) If it isn't create new and then save it in the Database.
 *    3) Send response that created accessory with status code 201.
 */
export const createAccessory = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    body: { name, image, price, description },
  } = req;
  const accessoryRepository = getRepository(Accessories);

  const existingAccessory = await accessoryRepository.findOne({
    where: { name }, // TODO: price, description
  });

  if (existingAccessory) {
    throw new BadRequestError(`Accessory is already added`, 'ACCESSORY_ALREADY_EXIST');
  }

  let accessoryData = accessoryRepository.create({
    name,
    image,
    price,
    description,
    createdBy: user?.id,
    updatedBy: user?.id,
  });

  accessoryData = await accessoryRepository.save(accessoryData);
  await accessoryRepository.save(accessoryData);

  res.status(201).json(accessoryData);
};

export const updateAccessoryValidation = {
  body: Joi.object({
    name: Joi.string().max(255).regex(new RegExp(namePattern)).required(),
    image: Joi.string().min(1).optional(),
    price: Joi.number().default(0),
    description: Joi.string().min(1),
  }),
};
/**
 * Title: Update Accessory API;
 * Created By: Sarang Patel;
 * steps:
 *    1) Retrive all request/updated accessory data.
 *    2) Then check that accessory is available or not.
 *    3) If it is then check that request data is valid and make update object of valid data.
 *    4) If all updated successfully then send update status 204 as a response.
 */
export const updateAccessory = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    body: { name, image, price, description },
    params: { id },
  } = req;

  const accessoryRepository = getCustomRepository(AccessoriesRepository);

  const accessoryById = await accessoryRepository.findOneOrFail(id);
  const uniqAccessory = await accessoryRepository.findOne({ where: { id: Not(id), name } });
  if (uniqAccessory) {
    throw new BadRequestError(`Accessory is already added`, 'ACCESSORY_ALREADY_EXIST');
  }

  if (name) accessoryById.name = name as string;
  if (image) accessoryById.image = image as string;
  if (price) accessoryById.price = price as number;
  if (description) accessoryById.description = description as string;
  accessoryById.updatedBy = user?.id;

  await accessoryRepository.save(accessoryById);

  res.sendStatus(204);
};

export const deleteAccessoryValidation = {
  params: Joi.object({ id: Joi.number().required() }),
};
/**
 * Title: Delete Accessory API;
 * Created By: Sarang Patel;
 * steps:
 *    1) Soft delete accessory of given id with Transactions.
 *    2) If all updated successfully then send delete status 204 as a response.
 */
export const removeAccessory = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { id: userId },
    params: { id },
  } = req;

  await getManager().transaction(async (em) => {
    await em.update(Accessories, { id }, { updatedBy: userId });
    await em.softDelete(Accessories, id);
  });

  res.sendStatus(204);
};
