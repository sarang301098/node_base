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
import { EmailTemplatesRepository } from '../repository/EmailTemplates';

import { EmailTemplates } from '../model/EmailTemplates';

export const getEmailTemplatesValidation = {
  query: Joi.object({
    search: Joi.string().max(50).allow(null).default(''),
    page: Joi.number().integer().min(1).default(1),
    perPage: Joi.number().integer().min(1).max(40).default(20),
  }),
};
export const getAll = () => async (req: Request, res: Response): Promise<void> => {
  const {
    query: { search, page, perPage },
  } = req;
  const emailTempRepository = getCustomRepository(EmailTemplatesRepository);

  let where: FindConditions<EmailTemplates> = {};

  if (search && search !== '') {
    where = { ...where, subject: ILike(`%${search}%`) };
  }

  const limit = Number(perPage);
  const offset = (Number(page) - 1) * limit;

  const [emailTemplates, count] = await emailTempRepository.findAndCount({
    where,
    take: limit,
    skip: offset,
  });

  res.status(200).json({ count, emailTemplates });
};

const namePattern = '^[A-za-z]';
export const createEmailTemplatesValidation = {
  body: Joi.object({
    subject: Joi.string().max(255).regex(new RegExp(namePattern)).required(),
    template: Joi.string().required(),
    key: Joi.string().required(),
  }),
};
export const createEmailTemplate = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    body: { subject, template, key },
  } = req;

  const emailTempRepository = getRepository(EmailTemplates);
  const existingemailTemplate = await emailTempRepository.findOne({ subject, key });

  if (existingemailTemplate) {
    throw new BadRequestError('Email template is already added', 'EMAIL_TEMPLATE_ALREADY_EXIST');
  }

  let emailTemplate = emailTempRepository.create({
    subject,
    template,
    key,
    createdBy: user?.id,
    updatedBy: user?.id,
  });

  emailTemplate = await emailTempRepository.save(emailTemplate);
  res.status(201).json(emailTemplate);
};

export const updateEmailTemplateValidation = {
  body: Joi.object({
    subject: Joi.string().max(255).regex(new RegExp(namePattern)).required(),
    template: Joi.string().required(),
    key: Joi.string().required(),
  }),
};
export const updateEmailTemplate = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    body: { subject, template, key },
    params: { id },
  } = req;

  const emailTempRepository = getCustomRepository(EmailTemplatesRepository);

  let emailTemplateToUpdate = await emailTempRepository.findByIdOrFail(id);
  const uniqTemplate = await emailTempRepository.findOne({
    where: { id: Not(id), subject, key },
  });
  if (uniqTemplate) {
    throw new BadRequestError(
      `Email Template with subject: ${subject} is already exist`,
      'EMAIL_TEMPLATE_ALREADY_EXIST',
    );
  }

  emailTemplateToUpdate = Object.assign({}, emailTemplateToUpdate, {
    subject,
    template,
    key,
    updatedBy: user?.id,
  });
  await emailTempRepository.save(emailTemplateToUpdate);

  res.sendStatus(204);
};

export const getEmailTemplateByIdValidation = {
  params: Joi.object({ id: Joi.number().required() }),
};
export const getById = () => async (req: Request, res: Response): Promise<void> => {
  const {
    params: { id },
  } = req;

  const emailTemplateRepository = getRepository(EmailTemplates);
  const emailTemplate = await emailTemplateRepository.findOneOrFail(id);

  res.status(200).json(emailTemplate);
};

export const deleteEmailTemplateValidation = {
  params: Joi.object({ id: Joi.number().required() }),
};
export const removeEmailTemplate = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { id: userId },
    params: { id },
  } = req;

  await getManager().transaction(async (em) => {
    await em.update(EmailTemplates, { id }, { updatedBy: userId });
    await em.softDelete(EmailTemplates, id);
  });

  res.sendStatus(204);
};
