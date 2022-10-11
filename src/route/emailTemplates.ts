import { Router } from 'express';
import { validate } from 'express-validation';

import { handleError, authenticate } from '../middleware';
import {
  getEmailTemplatesValidation,
  getAll,
  createEmailTemplatesValidation,
  createEmailTemplate,
  updateEmailTemplateValidation,
  updateEmailTemplate,
  deleteEmailTemplateValidation,
  removeEmailTemplate,
  getEmailTemplateByIdValidation,
  getById,
} from '../controller/emailTemplates';

const router = Router();

const getAllEmailTemplates = (): Router =>
  router.get(
    '/',
    authenticate,
    validate(getEmailTemplatesValidation, { context: true }),
    handleError(getAll()),
  );

const postCreateEmailTemplates = (): Router =>
  router.post(
    '/',
    authenticate,
    validate(createEmailTemplatesValidation, { context: true }),
    handleError(createEmailTemplate()),
  );

const putUpdateEmailTemplates = (): Router =>
  router.put(
    '/:id',
    authenticate,
    validate(updateEmailTemplateValidation, { context: true }),
    handleError(updateEmailTemplate()),
  );

const getEmailTemplateById = (): Router =>
  router.get(
    '/:id',
    authenticate,
    validate(getEmailTemplateByIdValidation, { context: true }),
    handleError(getById()),
  );

const deleteEmailTemplates = (): Router =>
  router.delete(
    '/:id',
    authenticate,
    validate(deleteEmailTemplateValidation),
    handleError(removeEmailTemplate()),
  );

export default (): Router =>
  router.use([
    getAllEmailTemplates(),
    postCreateEmailTemplates(),
    putUpdateEmailTemplates(),
    getEmailTemplateById(),
    deleteEmailTemplates(),
  ]);
