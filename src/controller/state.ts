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
import { StatesRepository } from '../repository/State';

import { States } from '../model/States';
import { ZipCodes } from '../model/ZipCodes';

export const getStatesValidation = {
  query: Joi.object({
    search: Joi.string().max(50).allow(null).default(''),
    page: Joi.number().integer().min(1).default(1),
    perPage: Joi.number().integer().min(1).max(40).default(20),
    sort: Joi.string().valid('ASC', 'DESC').default('ASC'),
    sortBy: Joi.string().default('name'),
  }),
};
export const getAll = () => async (req: Request, res: Response): Promise<void> => {
  const {
    query: { search, page, perPage, sort, sortBy },
  } = req;
  const sateRepository = getCustomRepository(StatesRepository);

  let where: FindConditions<States> = {};

  if (search && search !== '') {
    where = { ...where, name: ILike(`%${search}%`) };
  }

  const limit = Number(perPage);
  const offset = (Number(page) - 1) * limit;

  const [states, count] = await sateRepository.findAndCount({
    where,
    take: limit,
    skip: offset,
    order: { [sortBy as string]: sort },
  });

  res.status(200).json({ count, states });
};

const namePattern = '^[A-za-z]';
export const createStateValidation = {
  body: Joi.object({
    name: Joi.string().max(255).regex(new RegExp(namePattern)).required(),
    salesTax: Joi.number().required(),
    status: Joi.number().required(),
  }),
};
export const createState = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    body: { name, salesTax, status },
  } = req;

  const stateRepo = getRepository(States);
  const existingState = await stateRepo.findOne({ name });

  if (existingState) {
    throw new BadRequestError('State already exist', 'STATE_ALREADY_EXIST');
  }

  let state = stateRepo.create({
    name,
    salesTax,
    status,
    createdBy: user?.id,
    updatedBy: user?.id,
  });

  state = await stateRepo.save(state);
  res.status(201).json(state);
};

export const updateStateValidation = {
  body: Joi.object({
    name: Joi.string().max(255).regex(new RegExp(namePattern)).required(),
    salesTax: Joi.number().required(),
    status: Joi.number().required(),
  }),
};
export const updateState = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    body: { name, salesTax, status },
    params: { id },
  } = req;

  const stateRepository = getCustomRepository(StatesRepository);

  const stateToUpdate = await stateRepository.findByIdOrFail(id);
  const uniqState = await stateRepository.findOne({
    where: { id: Not(id), name },
  });
  if (uniqState) {
    throw new BadRequestError(`State with name: ${name} already exist`, 'State_ALREADY_EXIST');
  }
  const { salesTax: oldSalesTax } = stateToUpdate || {};

  if (salesTax !== oldSalesTax) {
    await getManager()
      .createQueryBuilder(ZipCodes, 'zipcode')
      .leftJoinAndSelect('zipcode.state', 'state')
      .where('state.id = :stateId', { stateId: id })
      .update()
      .set({ salesTax: () => `sales_tax + ${salesTax} - ${oldSalesTax}` })
      .execute();
  }

  await stateRepository.update(id, {
    name,
    salesTax,
    status,
    updatedBy: user?.id,
  });

  res.sendStatus(204);
};

export const deleteStateValidation = {
  params: Joi.object({ id: Joi.number().required() }),
};
export const removeState = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { id: userId },
    params: { id },
  } = req;

  await getManager().transaction(async (em) => {
    await em.update(States, { id }, { updatedBy: userId });
    await em.softDelete(States, id);
  });

  res.sendStatus(204);
};
