import { getManager, getRepository, getCustomRepository, FindConditions, Like, Not } from 'typeorm';
import { Request, Response } from 'express';
import { Joi } from 'express-validation';

import { BadRequestError } from '../error';
import { CategoriesRepository } from '../repository/Categories';

import { Categories } from '../model/Categories';

const namePattern = '^[A-za-z]';
export const getCategoriesValidation = {
  query: Joi.object({
    orderType: Joi.number().default(2),
    name: Joi.string().max(255).regex(new RegExp(namePattern)).default(null),
  }),
};
export const getAll = () => async (req: Request, res: Response): Promise<void> => {
  const {
    query: { orderType, name },
  } = req;
  const categoriesRepository = getCustomRepository(CategoriesRepository);

  let where: FindConditions<Categories> = {};

  // TODO: working but type error.
  if (orderType) {
    where = { ...where, orderType: Number(orderType) || 2 };
  }

  if (name && name !== '') {
    where = { ...where, name: Like(`%${name}%`) };
  }
  const [categories, count] = await categoriesRepository.findAndCount({
    where,
  });

  res.status(200).json({ count, categories });
};

export const createCategoryValidation = {
  body: Joi.object({
    name: Joi.string().max(255).regex(new RegExp(namePattern)).required(),
    orderType: Joi.number().default(null),
  }),
};
export const createCategory = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    body: { name, orderType },
  } = req;

  const categoriesRepository = getRepository(Categories);
  const existingCategory = await categoriesRepository.findOne({ where: { name, orderType } });

  if (existingCategory) {
    throw new BadRequestError('Category is already added', 'CATEGORY_ALREADY_EXIST');
  }

  let category = categoriesRepository.create({
    name,
    orderType,
    createdBy: user?.id,
    updatedBy: user?.id,
  });

  category = await categoriesRepository.save(category);
  await categoriesRepository.save(category);

  res.status(201).json(category);
};

export const updateCategoryValidation = {
  body: Joi.object({
    name: Joi.string().max(255).regex(new RegExp(namePattern)).required(),
    orderType: Joi.number().default(null),
  }),
};
export const updateCategory = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    body: { name, orderType },
    params: { id },
  } = req;

  const categoriesRepository = getCustomRepository(CategoriesRepository);

  await categoriesRepository.findByIdOrFail(id);
  const uniqCategory = await categoriesRepository.findOne({
    where: { id: Not(id), name, orderType },
  });
  if (uniqCategory) {
    throw new BadRequestError(
      `Category with name: ${name} is already added`,
      'CATEGORY_ALREADY_EXIST',
    );
  }
  await categoriesRepository.update(id, {
    name,
    orderType,
    updatedBy: user?.id,
  });

  res.sendStatus(204);
};

export const deleteCategoryValidation = {
  params: Joi.object({ id: Joi.number().required() }),
};
export const removeCategory = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { id: userId },
    params: { id },
  } = req;

  await getManager().transaction(async (em) => {
    await em.update(Categories, { id }, { updatedBy: userId });
    await em.softDelete(Categories, id);
  });

  res.sendStatus(204);
};
