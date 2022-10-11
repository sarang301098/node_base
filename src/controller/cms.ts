import { getManager, getRepository, getCustomRepository, FindConditions } from 'typeorm';
import { Request, Response } from 'express';
import { Joi } from 'express-validation';

import { PropaneUserType } from '../constants';
import { BadRequestError } from '../error';
import { CmsPagesRepository } from '../repository/cmsPages';

import { CmsPages } from '../model/CmsPages';

export const getCmsValidation = {
  query: Joi.object({
    userType: Joi.string()
      .valid(...Object.values(PropaneUserType))
      .default(''),
  }),
};
export const getAll = () => async (req: Request, res: Response): Promise<void> => {
  const {
    query: { userType },
  } = req;
  const cmsPagesRepository = getCustomRepository(CmsPagesRepository);

  let where: FindConditions<CmsPages> = {};

  if (userType) {
    where = { ...where, userType: userType as PropaneUserType };
  }

  const [cmsPages, count] = await cmsPagesRepository.findAndCount({ where });

  res.status(200).json({ count, cmsPages });
};

export const getSingleCmsValidation = {
  query: Joi.object({
    userType: Joi.string()
      .valid(...Object.values(PropaneUserType))
      .default(''),
    key: Joi.string().min(1).required(),
  }),
};
export const getSingle = () => async (req: Request, res: Response): Promise<void> => {
  const {
    query: { userType, key },
  } = req;

  const cmsPagesRepository = getCustomRepository(CmsPagesRepository);
  const cmsPages = await cmsPagesRepository.findOne({ where: { key, userType } });

  if (!cmsPages) {
    throw new BadRequestError('Cms Page is not available', 'CMS_NOT_FOUND');
  }

  res.status(200).json({ name: cmsPages?.name, content: cmsPages?.content });
};

const namePattern = '^[A-za-z]';
export const createCmsValidation = {
  body: Joi.object({
    name: Joi.string().max(255).regex(new RegExp(namePattern)).required(),
    content: Joi.string().required(),
    userType: Joi.alternatives(
      Joi.array()
        .items(Joi.string().valid(...Object.values(PropaneUserType)))
        .default(null),
      Joi.string()
        .valid(...Object.values(PropaneUserType))
        .default(null),
    ),
  }),
};
export const createCms = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    body: { name, content, userType },
  } = req;

  const cmsRepository = getRepository(CmsPages);
  const existingCms = await cmsRepository.findOne({ where: { name, userType } });

  if (existingCms) {
    throw new BadRequestError('CMS already exist', 'CMS_ALREADY_EXIST');
  }

  let cms = cmsRepository.create({
    name,
    content,
    userType,
    key: 'test CMSs',
    createdBy: user?.id,
    updatedBy: user?.id,
  });

  cms = await cmsRepository.save(cms);
  await cmsRepository.save(cms);

  res.status(201).json(cms);
};

export const updateCmsValidation = {
  body: Joi.object({
    name: Joi.string().max(255).regex(new RegExp(namePattern)).required(),
    content: Joi.string().required(),
  }),
};
export const updateCms = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    body: { name, content },
    params: { id },
  } = req;

  const cmsRepository = getCustomRepository(CmsPagesRepository);

  await cmsRepository.findByIdOrFail(id);
  await cmsRepository.update(id, {
    name,
    content,
    updatedBy: user?.id,
  });

  res.sendStatus(204);
};

export const getByIdCmsValidation = {
  params: Joi.object({ id: Joi.number().required() }),
};
export const getByIdCms = () => async (req: Request, res: Response): Promise<void> => {
  const {
    params: { id },
  } = req;

  const cmsRepository = getCustomRepository(CmsPagesRepository);
  const cmsPage = await cmsRepository.findOne(id);

  res.status(200).json(cmsPage);
};

export const deleteCmsValidation = {
  params: Joi.object({ id: Joi.number().required() }),
};
export const removeCms = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { id: userId },
    params: { id },
  } = req;

  await getManager().transaction(async (em) => {
    await em.update(CmsPages, { id }, { updatedBy: userId });
    await em.softDelete(CmsPages, id);
  });

  res.sendStatus(204);
};
