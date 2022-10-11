import { getRepository, getManager, getCustomRepository, Brackets, Between, Not } from 'typeorm';
import { Request, Response } from 'express';
import { Joi } from 'express-validation';
import moment from 'moment';

import { BadRequestError } from '../error';
import { GovernmentHolidays } from '../model/GovernmentHolidays';
import { GovernmentHolidaysRepository } from '../repository/GovernmentHolidays';

export const getgovernmentHolidayValidation = {
  query: Joi.object({
    search: Joi.string().max(50).allow(null).default(''),
    page: Joi.number().integer().min(1).default(1),
    perPage: Joi.number().integer().min(1).max(40).default(20),
    vendorId: Joi.string().uuid({ version: 'uuidv4' }).default('all'),
  }),
};
export const getAll = () => async (req: Request, res: Response): Promise<void> => {
  const {
    query: { search, page, perPage, vendorId },
  } = req;

  const limit = Number(perPage);
  const offset = (Number(page) - 1) * limit;

  const query = getManager()
    .createQueryBuilder(GovernmentHolidays, 'governmentHoliday')
    .offset(offset)
    .limit(limit);

  // TODO; Remove Brackets because it's make query more complex and also increase timecomplexity.
  if (search && search !== '') {
    query.andWhere(
      new Brackets((qb) => {
        qb.where('governmentHoliday.description like :description', {
          description: `%${search}%`,
        }).orWhere('governmentHoliday.date like :date', { date: `%${search}%` });
      }),
    );
  }

  if (vendorId && vendorId !== 'all') {
    query.andWhere('FIND_IN_SET(:vendorId, governmentHoliday.vendorIds)', {
      vendorId,
    });
  }

  const [holidays, count] = await query.getManyAndCount();
  res.status(200).json({ count, holidays });
};

export const getByIdGovernmentHolidayValidation = {
  params: Joi.object({ id: Joi.number().integer().required() }),
};
export const getIdGovernmentHoliday = () => async (req: Request, res: Response): Promise<void> => {
  const {
    params: { id },
  } = req;

  const governmentHolidaysRepository = getCustomRepository(GovernmentHolidaysRepository);
  const governmentHolidays = await governmentHolidaysRepository.findByIdOrFail(id);
  res.status(200).json({ governmentHolidays });
};

export const createGovernmentHolidayValidation = {
  body: Joi.object({
    date: Joi.date().required(),
    vendorIds: Joi.array()
      .items(Joi.string().uuid({ version: 'uuidv4' }))
      .allow(null),
    description: Joi.string().required(),
  }),
};
export const createGovernmentHoliday = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { id: userId },
    body: { date, vendorIds, description },
  } = req;

  const start = moment(date).startOf('day').toDate();
  const end = moment(date).endOf('day').toDate();

  const governmentHolidayRepo = getRepository(GovernmentHolidays);
  const existingHoliday = await governmentHolidayRepo.findOne({
    where: {
      description,
      date: Between(start, end),
    },
  });

  if (existingHoliday) {
    throw new BadRequestError(
      'Government Holiday with given details is already available',
      'GOVERNMENTHOLIDAY_ALREADY_AVAILABLE',
    );
  }

  let newGovernmentHoliday = governmentHolidayRepo.create({
    date,
    vendorIds,
    description,
    createdBy: userId,
    updatedBy: userId,
  });

  newGovernmentHoliday = await governmentHolidayRepo.save(newGovernmentHoliday);
  res.status(201).json(newGovernmentHoliday);
};

export const updateGovernmentHolidayValidation = {
  body: Joi.object({
    date: Joi.date().required(),
    vendorIds: Joi.array()
      .items(Joi.string().uuid({ version: 'uuidv4' }))
      .allow(null),
    description: Joi.string().required(),
  }),
};
export const updateGovernmentHoliday = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    body: { date, vendorIds, description },
    params: { id },
  } = req;

  const governmentHolidayRepository = getCustomRepository(GovernmentHolidaysRepository);
  const holidayById = await governmentHolidayRepository.findByIdOrFail(id);

  if (date) holidayById.date = date as Date;
  if (description) holidayById.description = (description || '') as string;
  if (vendorIds) holidayById.vendorIds = (vendorIds || []) as string[];
  holidayById.updatedBy = user?.id;

  const start = moment(date).startOf('day').toDate();
  const end = moment(date).endOf('day').toDate();
  const uniqHoliday = await governmentHolidayRepository.findOne({
    where: { id: Not(id), date: Between(start, end), description },
  });
  if (uniqHoliday) {
    throw new BadRequestError(
      `Government Holiday with date: ${moment(date).format('MMM DD YYYY')} already exist`,
      'EMAIL_TEMPLATE_ALREADY_EXIST',
    );
  }

  await governmentHolidayRepository.save(holidayById);
  res.sendStatus(204);
};

export const deleteGovernmentHolidayValidation = {
  params: Joi.object({ id: Joi.number().required() }),
};
export const removeGovernmentHoliday = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { id: userId },
    params: { id },
  } = req;

  const governmentHolidayRepo = getRepository(GovernmentHolidays);
  const governmentHoliday = await governmentHolidayRepo.findOne(id);

  if (!governmentHoliday) {
    throw new BadRequestError(
      `Government Holiday of id: ${id} not available`,
      'GOVERNMENTHOLIDAY_NOT_FOUND',
    );
  }

  await getManager().transaction(async (em) => {
    await em.update(GovernmentHolidays, { id }, { updatedBy: userId });
    await em.softDelete(GovernmentHolidays, id);
  });

  res.sendStatus(204);
};
