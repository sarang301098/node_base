import { getRepository, getCustomRepository, getManager, Not, Brackets } from 'typeorm';
import { Request, Response } from 'express';
import { Joi } from 'express-validation';

import { BadRequestError } from '../error';
import { ZipCodesRepository } from '../repository/zipcodes';

import { ZipCodes } from '../model/ZipCodes';
import { Counties } from '../model/Counties';
import { States } from '../model/States';

const countTotalTax = (tax1: number, tax2: number, tax3: number) => tax1 + tax2 + tax3;

export const getZipCodesValidation = {
  query: Joi.object({
    search: Joi.string().max(50).allow(null).default(null),
    stateId: Joi.number().integer().default(null),
    countyId: Joi.number().integer().default(null),
    page: Joi.number().integer().min(1).default(1),
    perPage: Joi.number().integer().min(1).default(10),
    isFilters: Joi.boolean().optional().default(true),
    sort: Joi.string().valid('ASC', 'DESC').default('ASC'),
    sortBy: Joi.string().default('name'),
  }),
};
export const getAll = () => async (req: Request, res: Response): Promise<void> => {
  const {
    query: { search, page, perPage, stateId, countyId, sort, sortBy, isFilters },
  } = req;

  const zipcodeRepository = getRepository(ZipCodes);
  const limit = Number(perPage);
  const offset = (Number(page) - 1) * limit;

  const query = getManager()
    .createQueryBuilder(ZipCodes, 'zipcode')
    .leftJoin('zipcode.county', 'county')
    .addSelect(['county.id', 'county.name'])
    .leftJoin('zipcode.state', 'state')
    .addSelect(['state.id', 'state.name'])
    .where('state.id = :stateId', { stateId })
    .andWhere('county.id = :countyId', { countyId })
    .offset(offset)
    .limit(limit);

  if (search && search !== '') {
    query.andWhere(
      new Brackets((qb) => {
        qb.where('zipcode.areaName like :areaName', {
          areaName: '%' + search + '%',
        }).orWhere('zipcode.zipcode like :zipcode', { zipcode: '%' + search + '%' });
      }),
    );
  }

  if (sort && sortBy) {
    query.orderBy('zipcode.areaName', sort as 'ASC' | 'DESC');
  }

  const [zipcodes, count] = isFilters
    ? await query.getManyAndCount()
    : await zipcodeRepository.findAndCount({ select: ['id', 'zipcode'] });

  const state = await getManager()
    .getRepository(States)
    .findOne({ where: { id: stateId }, select: ['id', 'name'] });
  const county = await getManager()
    .getRepository(Counties)
    .findOne({ where: { id: countyId }, select: ['id', 'name'] });

  res.status(200).json({ count, zipcodes, state, county });
};

const namePattern = '^[A-za-z]';
export const createZipCodeValidation = {
  body: Joi.object({
    areaName: Joi.string().max(255).regex(new RegExp(namePattern)).required(),
    countyId: Joi.number().required(),
    zipcode: Joi.number().integer().required(),
    status: Joi.number().required(),
  }),
};
export const createZipCode = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    body: { areaName, zipcode, status, countyId },
  } = req;

  const zipcodeRepository = getRepository(ZipCodes);
  const countyRepository = getRepository(Counties);
  let countyData = await countyRepository.findOne({
    where: { id: countyId },
    relations: ['state'],
  });

  if (!countyData) {
    throw new BadRequestError('County Not available', 'COUNTY_NOT_FOUND');
  } else if (!countyData?.state) {
    throw new BadRequestError('State Not available', 'STATE_NOT_FOUND');
  }

  const existingZipcode = await zipcodeRepository.findOne({
    where: { county: countyData, zipcode },
  });

  if (existingZipcode) {
    throw new BadRequestError('Zipcode already exist', 'ZIPCODE_ALREADY_EXIST');
  }

  countyData = Object.assign({}, countyData, {
    updatedBy: user?.id,
    totalZipcodes: (countyData?.totalZipcodes || 0) + 1,
  });

  let zipcodeData = zipcodeRepository.create({
    areaName,
    zipcode,
    status,
    salesTax: countTotalTax(
      countyData?.salesTaxOne || 0,
      countyData?.salesTaxTwo || 0,
      countyData?.state?.salesTax || 0,
    ),
    county: countyData,
    state: countyData?.state,
    createdBy: user?.id,
    updatedBy: user?.id,
  });

  zipcodeData = await zipcodeRepository.save(zipcodeData);
  await countyRepository.save(countyData);

  res.status(201).json(zipcodeData);
};

export const updateZipcodeValidation = {
  body: Joi.object({
    areaName: Joi.string().max(255).regex(new RegExp(namePattern)).required(),
    zipcode: Joi.number().required(),
    status: Joi.number().required(),
  }),
  params: Joi.object({ id: Joi.number().integer().required() }),
};
export const updateZipcode = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    body: { areaName, zipcode, status },
    params: { id },
  } = req;

  const zipcodeRepository = getCustomRepository(ZipCodesRepository);

  let zipcodeToUpdate = await zipcodeRepository.findByIdOrFail(id);
  const uniqSlot = await zipcodeRepository.findOne({
    where: { id: Not(id), areaName, zipcode },
  });
  if (uniqSlot) {
    throw new BadRequestError(
      `Zipcode is already available with Area: ${areaName} and Zipcode: ${zipcode}`,
      'ZIPCODE_ALREADY_AVAILABLE',
    );
  }

  zipcodeToUpdate = Object.assign({}, zipcodeToUpdate, {
    areaName,
    zipcode,
    status,
    updatedBy: user?.id,
  });

  await zipcodeRepository.save(zipcodeToUpdate);

  res.json(zipcodeToUpdate);
};

export const deleteZipcodeValidation = {
  params: Joi.object({ id: Joi.number().required() }),
};
export const removeZipcode = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { id: userId },
    params: { id },
  } = req;

  const zipcodeRepository = getRepository(ZipCodes);
  const { countyId } = await zipcodeRepository.findOneOrFail({
    where: { id },
  });

  await getManager().transaction(async (em) => {
    await em.update(ZipCodes, { id }, { updatedBy: userId });
    await em.softDelete(ZipCodes, id);
    await em.decrement(Counties, { id: countyId }, 'totalZipcodes', 1);
  });

  res.sendStatus(204);
};

export const getZipAll = () => async (req: Request, res: Response): Promise<void> => {
  const query = getManager()
    .createQueryBuilder(ZipCodes, 'zipcode')
    .select(['zipcode.id', 'zipcode.zipcode']);
  const zipCode = await query.getMany();

  res.status(200).json({ zipCode });
};
