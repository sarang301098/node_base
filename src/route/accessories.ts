import { Router } from 'express';
import { validate } from 'express-validation';

import { handleError, authenticate } from '../middleware';
import {
  getAccessoriesValidation,
  getAll,
  createAccessoryValidation,
  createAccessory,
  updateAccessoryValidation,
  updateAccessory,
  deleteAccessoryValidation,
  removeAccessory,
} from '../controller/accessories';

const router = Router();

const getAllAccessory = (): Router =>
  router.get(
    '/',
    authenticate,
    validate(getAccessoriesValidation, { context: true }),
    handleError(getAll()),
  );

const postcreateAccessory = (): Router =>
  router.post(
    '/',
    authenticate,
    validate(createAccessoryValidation, { context: true }),
    handleError(createAccessory()),
  );

const putupdateAccessory = (): Router =>
  router.put(
    '/:id',
    authenticate,
    validate(updateAccessoryValidation, { context: true }),
    handleError(updateAccessory()),
  );

const deleteAccessory = (): Router =>
  router.delete(
    '/:id',
    authenticate,
    validate(deleteAccessoryValidation),
    handleError(removeAccessory()),
  );

export default (): Router =>
  router.use([getAllAccessory(), postcreateAccessory(), putupdateAccessory(), deleteAccessory()]);
