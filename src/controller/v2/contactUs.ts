import { Brackets, getManager, getRepository } from 'typeorm';
import { Request, Response } from 'express';
import { Joi } from 'express-validation';

import config from '../../config';
import { MailService } from '../../service/Mail';
import { ContactUs } from '../../model/ContactUs';

export const userContactUsValidation = {
  body: Joi.object({
    subject: Joi.string().max(255).required(),
    message: Joi.string().max(255).required(),
  }),
};

export const userContactUs = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    body: { subject, message },
  } = req;

  const mailServices = new MailService();
  const mailBodyAdmin = {
    email: user.email,
    subject: subject,
    message: message,
    text: 'contact_us',
    adminContactEmail: config.ADMIN_CONTACT_EMAIL,
    to: config.ADMIN_CONTACT_EMAIL,
  };
  mailServices.send(mailBodyAdmin);

  const mailBodyUser = {
    to: user.email,
    email: user.email,
    subject: subject,
    message: message,
    text: 'appreciate',
    adminContactEmail: config.ADMIN_CONTACT_EMAIL,
  };
  mailServices.send(mailBodyUser);

  const contactUsRepo = getRepository(ContactUs);
  const contactUs = contactUsRepo.create({
    subject,
    message,
    userType: user.userType,
    user,
  });

  await contactUsRepo.save(contactUs);
  res.sendStatus(201);
};

export const contactUsListValidation = {
  query: Joi.object({
    search: Joi.string().max(255).optional(),
    page: Joi.number().integer().min(1).default(1),
    perPage: Joi.number().integer().min(1).default(10),
  }),
};

export const contactUsList = () => async (req: Request, res: Response): Promise<void> => {
  const {
    query: { search, page, perPage },
  } = req;
  const limit = Number(perPage);
  const offset = (Number(page) - 1) * limit;
  const query = getManager()
    .createQueryBuilder(ContactUs, 'contactUs')
    .select(['contactUs.subject', 'contactUs.createdAt'])
    .leftJoin('contactUs.user', 'user')
    .addSelect(['user.fullName', 'user.email'])
    .offset(offset)
    .limit(limit);

  if (search && search !== null) {
    query.where(
      new Brackets((qb) => {
        return qb
          .orWhere('contactUs.subject like :subject', { subject: '%' + search + '%' })
          .orWhere('user.fullName like :name', { name: '%' + search + '%' })
          .orWhere('user.email like :email', { email: '%' + search + '%' });
      }),
    );
  }
  const list = await query.getRawMany();
  res.status(200).json({ list });
};

export const removeContactUsValidation = {
  params: Joi.object({ id: Joi.number().integer().required() }),
};

export const removeContactUs = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { id: userId },
    params: { id },
  } = req;
  const contactUsRepo = getRepository(ContactUs);
  await contactUsRepo.findOneOrFail(id);

  await getManager().transaction(async (em) => {
    await em.update(ContactUs, { id }, { updatedBy: userId });
    await em.softDelete(ContactUs, id);
  });

  res.sendStatus(204);
};

export const adminContactUsValidation = {
  body: Joi.object({
    message: Joi.string().max(255).required(),
  }),
  params: Joi.object({ id: Joi.number().min(0).required() }),
};

export const adminContactUs = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    body: { message },
    params: { id },
  } = req;
  const userEmail = await getManager()
    .createQueryBuilder(ContactUs, 'contactUs')
    .select(['contactUs.id'])
    .where('contactUs.id =:id', { id })
    .leftJoin('contactUs.user', 'user')
    .addSelect(['user.email'])
    .getOneOrFail();

  const mailServices = new MailService();
  const mailBodyAdmin = {
    to: userEmail.user.email,
    email: user.email,
    message: message,
    text: 'appreciate',
    adminContactEmail: config.ADMIN_CONTACT_EMAIL,
  };
  mailServices.send(mailBodyAdmin);

  res.sendStatus(201);
};
