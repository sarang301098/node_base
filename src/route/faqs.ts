import { Router } from 'express';
import { validate } from 'express-validation';

import {
  getAllFaqsValidation,
  getAllFaqs,
  createFaqsValidation,
  createFaqs,
  deleteFaqsValidation,
  removeFaqs,
  updateFaqsValidation,
  updateFaqs,
} from '../controller/faqs';
import { authenticate, handleError, checkUserType } from '../middleware';
import { PropaneUserType } from '../constants';

const router = Router();
const getFaqs = (): Router =>
  router.get(
    '/',
    authenticate,
    validate(getAllFaqsValidation, { context: true }),
    handleError(getAllFaqs()),
  );

const postCreateFaq = (): Router =>
  router.post(
    '/',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(createFaqsValidation),
    handleError(createFaqs()),
  );

const putupdateFaqs = () =>
  router.put(
    '/:id',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(updateFaqsValidation),
    handleError(updateFaqs()),
  );

const deleteFaqs = (): Router =>
  router.delete(
    '/:id',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(deleteFaqsValidation),
    handleError(removeFaqs()),
  );

export default (): Router =>
  router.use([getFaqs(), postCreateFaq(), deleteFaqs(), putupdateFaqs()]);
