import { MailService } from '../service/Mail';
import { Request, Response } from 'express';
import config from '../config';
import { Joi } from 'express-validation';
import { getRepository } from 'typeorm';
import { Notification } from '../model/Notification';

export const contactUsValidation = {
  body: Joi.object({
    subject: Joi.string().max(255).required(),
    message: Joi.string().max(255).required(),
  }),
};

export const contactUs = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    body: { subject, message },
  } = req;

  const mailServicesSendAdmin = new MailService();
  const mailBodyAdmin = {
    to: config.ADMIN_CONTACT_EMAIL,
    email: user.email,
    fullname: user?.fullName,
    subject: subject,
    message: message,
    text: 'contact_us',
    adminContactEmail: config.ADMIN_CONTACT_EMAIL,
  };
  mailServicesSendAdmin.send(mailBodyAdmin);

  const mailServicesSendUser = new MailService();
  const mailBodyUser = {
    to: user.email,
    email: user.email,
    fullname: user?.fullName,
    subject: subject,
    message: message,
    text: 'appreciate',
    adminContactEmail: config.ADMIN_CONTACT_EMAIL,
  };
  mailServicesSendUser.send(mailBodyUser);

  const notificationRepo = getRepository(Notification);
  const notification = notificationRepo.create({
    readedBy: [],
    deletedBy: [],
    title: subject,
    toIds: [user?.id],
    description: 'Your request has been sent to admin',
    adminMessage: `Mr/Ms ${user.fullName} try to contact you.`,
  });

  await notificationRepo.save(notification);
  res.sendStatus(201);
};
