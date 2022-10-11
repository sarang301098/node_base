import { Router } from 'express';
import { validate } from 'express-validation';

import { handleError, authenticate } from '../middleware';
import {
  createCountyValidation,
  createCounty,
  getCountiesValidation,
  getAll,
  updateCountyValidation,
  updateCounty,
  deleteCountyValidation,
  removeCounty,
} from '../controller/county';

const router = Router();

const getAllCounties = (): Router =>
  router.get(
    '/',
    authenticate,
    validate(getCountiesValidation, { context: true }),
    handleError(getAll()),
  );

const postCreateCounty = (): Router =>
  router.post(
    '/',
    authenticate,
    validate(createCountyValidation, { context: true }),
    handleError(createCounty()),
  );

const putUpdateCounty = (): Router =>
  router.put(
    '/:id',
    authenticate,
    validate(updateCountyValidation, { context: true }),
    handleError(updateCounty()),
  );

const deleteCounty = (): Router =>
  router.delete(
    '/:id',
    authenticate,
    validate(deleteCountyValidation),
    handleError(removeCounty()),
  );

export default (): Router =>
  router.use([getAllCounties(), postCreateCounty(), putUpdateCounty(), deleteCounty()]);
