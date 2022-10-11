import { getRepository, getCustomRepository, getManager, Not } from 'typeorm';
import { Request, Response } from 'express';
import { Joi } from 'express-validation';

import { BadRequestError } from '../error';
import { CountiesRepository } from '../repository/county';

import { ZipCodes } from '../model/ZipCodes';
import { Counties } from '../model/Counties';
import { States } from '../model/States';

export const getCountiesValidation = {
  query: Joi.object({
    search: Joi.string(),
    stateId: Joi.number().integer().default(null),
    page: Joi.number().integer().min(1).default(1),
    perPage: Joi.number().integer().min(1).max(40).default(20),
    sort: Joi.string().valid('ASC', 'DESC').default('ASC'),
    sortBy: Joi.string().default('name'),
  }),
};
export const getAll = () => async (req: Request, res: Response): Promise<void> => {
  const {
    query: { search, page, perPage, stateId, sort, sortBy },
  } = req;

  const limit = Number(perPage);
  const offset = (Number(page) - 1) * limit;

  const query = getManager()
    .createQueryBuilder(Counties, 'county')
    .leftJoin('county.state', 'state')
    .addSelect(['state.id', 'state.name'])
    .where('state.id = :stateId', { stateId })
    .offset(offset)
    .limit(limit);

  if (sort && sortBy) {
    query.orderBy('county.name', sort as 'ASC' | 'DESC');
  }

  if (search && search !== '') {
    query.andWhere('county.name like :name', { name: '%' + search + '%' });
  }

  const [counties, count] = await query.getManyAndCount();
  const state = await getManager()
    .getRepository(States)
    .findOne({ where: { id: stateId }, select: ['id', 'name'] });

  res.status(200).json({ count, counties, state });
};

const namePattern = '^[A-za-z]';
export const createCountyValidation = {
  body: Joi.object({
    name: Joi.string().max(255).regex(new RegExp(namePattern)).required(),
    stateId: Joi.number().required(),
    salesTaxOne: Joi.number().required(),
    salesTaxTwo: Joi.number().required(),
    status: Joi.number().required(),
  }),
};
export const createCounty = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    body: { name, salesTaxOne, salesTaxTwo, status, stateId },
  } = req;

  const countyRepository = getRepository(Counties);
  const stateRepository = getRepository(States);
  let stateData = await stateRepository.findOne(stateId);
  const existingCounty = await countyRepository.findOne({ where: { state: stateId, name } });

  if (!stateData) {
    throw new BadRequestError('State Not Found', 'STATE_NOT_FOUND');
  }

  if (existingCounty) {
    throw new BadRequestError('County is already added', 'COUNTY_ALREADY_EXIST');
  }

  stateData = Object.assign({}, stateData, {
    updatedBy: user?.id,
    totalCounties: (stateData?.totalCounties || 0) + 1,
  });

  let county = countyRepository.create({
    name,
    salesTaxOne,
    salesTaxTwo,
    status,
    state: stateData,
    createdBy: user?.id,
    updatedBy: user?.id,
  });

  county = await countyRepository.save(county);
  await stateRepository.save(stateData);
  county = Object.assign({}, county, { state: undefined });

  res.status(201).json(county);
};

export const updateCountyValidation = {
  params: Joi.object({
    id: Joi.number().integer().min(1).required(),
  }),
  body: Joi.object({
    name: Joi.string().max(255).regex(new RegExp(namePattern)).required(),
    salesTaxOne: Joi.number().required(),
    salesTaxTwo: Joi.number().required(),
    status: Joi.number().required(),
  }),
};
export const updateCounty = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    body: { name, salesTaxOne, salesTaxTwo, status },
    params: { id },
  } = req;

  const countyRepository = getCustomRepository(CountiesRepository);

  const countyToUpdate = await countyRepository.findByIdOrFail(id);
  const uniqCounty = await countyRepository.findOne({
    where: { id: Not(id), name },
  });
  if (uniqCounty) {
    throw new BadRequestError(`County with name: ${name} is already added`, 'COUNTY_ALREADY_EXIST');
  }
  const { salesTaxOne: oldSalesTaxOne, salesTaxTwo: oldSalesTaxTwo } = countyToUpdate || {};

  if (salesTaxOne !== oldSalesTaxOne || salesTaxTwo !== oldSalesTaxTwo) {
    await getManager()
      .createQueryBuilder(ZipCodes, 'zipcode')
      .update()
      .set({
        salesTax: () =>
          `sales_tax + ${salesTaxOne} - ${oldSalesTaxOne} + ${salesTaxTwo} - ${oldSalesTaxTwo}`,
      })
      .where('county_id = :id', { id })
      .execute();
  }

  await countyRepository.update(id, {
    name,
    salesTaxOne,
    salesTaxTwo,
    status,
    updatedBy: user?.id,
  });

  res.sendStatus(204);
};

export const deleteCountyValidation = {
  params: Joi.object({ id: Joi.number().required() }),
};
export const removeCounty = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { id: userId },
    params: { id },
  } = req;

  const countyRepository = getRepository(Counties);
  const { stateId } = await countyRepository.findOneOrFail({ where: { id } });
  await getManager().transaction(async (em) => {
    await em.update(Counties, { id }, { updatedBy: userId });
    await em.softDelete(Counties, id);
    await em.decrement(States, { id: stateId }, 'totalCounties', 1);
  });

  res.sendStatus(204);
};
