import {
  getRepository,
  getCustomRepository,
  getManager,
  FindConditions,
  ILike,
  Not,
} from 'typeorm';

import { Request, Response } from 'express';
import { Joi } from 'express-validation';

import { BadRequestError } from '../error';
import { DeliveryLocationsRepository } from '../repository/DeliveryLocation';

import { DeliveryLocations } from '../model/deliveryLocations';

export const getDeliveryLocationsValidation = {
  query: Joi.object({
    search: Joi.string().max(50).allow(null).default(''),
    sort: Joi.string().valid('ASC', 'DESC').default('DESC'),
    sortBy: Joi.string().valid('name').default('createdAt'),
    page: Joi.number().integer().min(1).default(1),
    perPage: Joi.number().integer().min(1).default(10),
  }),
};
export const getAll = () => async (req: Request, res: Response): Promise<void> => {
  const {
    query: { search, sort, sortBy, page, perPage },
  } = req;
  const limit = Number(perPage);
  const offset = (Number(page) - 1) * limit;
  const deliveryLocRepository = getCustomRepository(DeliveryLocationsRepository);

  let where: FindConditions<DeliveryLocations> = {};

  if (search && search !== '') {
    where = { ...where, name: ILike(`%${search}%`) };
  }

  const [deliveryLocations, count] = await deliveryLocRepository.findAndCount({
    where,
    order: { [sortBy as string]: sort },
    take: limit,
    skip: offset,
  });

  res.status(200).json({ count, deliveryLocations });
};

const namePattern = '^[A-za-z]';
export const createDeliveryLocationValidation = {
  body: Joi.object({
    name: Joi.string().max(255).regex(new RegExp(namePattern)).required(),
    description: Joi.string(),
    price: Joi.number(),
  }),
};
export const createDeliveryLocation = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    body: { name, description, price },
  } = req;

  const deliveryLocRepository = getRepository(DeliveryLocations);
  const existingLocation = await deliveryLocRepository.findOne({ name });
  const existingDescription = await deliveryLocRepository.findOne({ description });

  if (existingLocation) {
    throw new BadRequestError('Delivery Locaiton already exist', 'DELIVERY_LOCATION_ALREADY_EXIST');
  }

  if (existingDescription) {
    throw new BadRequestError('Description already exist', 'Description_ALREADY_EXIST');
  }

  let deliveryLocation = deliveryLocRepository.create({
    name,
    description,
    price,
    createdBy: user?.id,
    updatedBy: user?.id,
  });

  deliveryLocation = await deliveryLocRepository.save(deliveryLocation);
  res.status(201).json(deliveryLocation);
};

export const updateDeliveryLocationValidation = {
  body: Joi.object({
    name: Joi.string().max(255).regex(new RegExp(namePattern)).required(),
    description: Joi.string(),
    price: Joi.number(),
  }),
};
export const updateDeliveryLocation = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    body: { name, description, price },
    params: { id },
  } = req;

  const deliveryLocRepository = getCustomRepository(DeliveryLocationsRepository);

  let locationToUpdate = await deliveryLocRepository.findByIdOrFail(id);
  const uniqLocation = await deliveryLocRepository.findOne({
    where: { id: Not(id), name },
  });

  if (uniqLocation) {
    throw new BadRequestError(
      `Location with name: ${name} is already exist`,
      'LOCATION_ALREADY_EXIST',
    );
  }
  locationToUpdate = Object.assign({}, locationToUpdate, {
    name,
    description,
    price,
    updatedBy: user?.id,
  });
  await deliveryLocRepository.save(locationToUpdate);

  res.sendStatus(204);
};

export const deleteDeliveryLocationValidation = {
  params: Joi.object({ id: Joi.number().required() }),
};
export const removeDeliveryLocation = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { id: userId },
    params: { id },
  } = req;

  await getManager().transaction(async (em) => {
    await em.update(DeliveryLocations, { id }, { updatedBy: userId });
    await em.softDelete(DeliveryLocations, id);
  });
  res.sendStatus(204);
};

export const restoreDeliveryLocationValidation = {
  params: Joi.object({ id: Joi.number().required() }),
};
export const restoreDeliveryLocation = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { id: userId },
    params: { id },
  } = req;

  await getManager().transaction(async (em) => {
    await em.update(DeliveryLocations, { id }, { updatedBy: userId });
    await em.restore(DeliveryLocations, id);
  });
  res.sendStatus(204);
};
