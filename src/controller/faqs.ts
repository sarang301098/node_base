import { FindConditions, getCustomRepository, getManager, getRepository, Not } from 'typeorm';
import { Request, Response } from 'express';
import { Joi } from 'express-validation';

import { Faqs } from '../model/Faqs';
import { FaqsPageRepository } from '../repository/faqsPages';

import { BadRequestError } from '../error';
import { PropaneUserType } from '../constants';

export const getAllFaqsValidation = {
  query: Joi.object({
    userType: Joi.string()
      .valid(...Object.values(PropaneUserType))
      .default(null),
    page: Joi.number().integer().min(1).default(1),
    perPage: Joi.number().integer().min(1).default(200),
  }),
};
export const getAllFaqs = () => async (req: Request, res: Response): Promise<void> => {
  const {
    query: { userType, page, perPage },
  } = req;

  const faqsRepository = getCustomRepository(FaqsPageRepository);
  let where: FindConditions<Faqs> = {};

  if (userType) {
    where = { ...where, userType: userType as PropaneUserType };
  }

  const limit = Number(perPage);
  const offset = (Number(page) - 1) * limit;

  const [faqs, count] = await faqsRepository.findAndCount({
    where,
    take: limit,
    skip: offset,
  });

  res.status(200).json({ count, faqs });
};

export const createFaqsValidation = {
  body: Joi.object({
    question: Joi.string().required(),
    answer: Joi.string().required(),
    userType: Joi.string()
      .valid(...Object.values(PropaneUserType))
      .default(null),
  }),
};
export const createFaqs = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { id: userId },
    body: { question, answer, userType },
  } = req;

  const faqsRepository = getRepository(Faqs);
  const existingFaq = await faqsRepository.findOne({ where: { question, answer, userType } });

  if (existingFaq) {
    throw new BadRequestError('Faq is already exist', 'FAQ_ALREADY_EXIST');
  }

  let faq = faqsRepository.create({
    question,
    answer,
    userType,
    createdBy: userId,
    updatedBy: userId,
  });

  faq = await faqsRepository.save(faq);
  res.status(201).json(faq);
};

export const updateFaqsValidation = {
  body: Joi.object({
    question: Joi.string().required(),
    answer: Joi.string().required(),
  }),
  params: Joi.object({ id: Joi.number().integer().required() }),
};
export const updateFaqs = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { id: userId },
    body: { question, answer },
    params: { id },
  } = req;

  const faqsRepository = getCustomRepository(FaqsPageRepository);
  await faqsRepository.findByIdOrFail(id);

  const uniqFaq = await faqsRepository.findOne({
    where: { id: Not(id), question, answer },
  });
  if (uniqFaq) {
    throw new BadRequestError(`Faq is already exist`, 'FAQ_ALREADY_EXIST');
  }

  await faqsRepository.update(id, {
    answer,
    question,
    updatedBy: userId,
  });

  res.sendStatus(204);
};

export const deleteFaqsValidation = {
  params: Joi.object({ id: Joi.number().integer().required() }),
};
export const removeFaqs = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { id: userId },
    params: { id },
  } = req;

  await getManager().transaction(async (em) => {
    await em.update(Faqs, { id }, { updatedBy: userId });
    await em.softDelete(Faqs, id);
  });

  res.sendStatus(204);
};
