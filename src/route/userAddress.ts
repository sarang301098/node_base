import { Router } from 'express';
import { validate } from 'express-validation';

import { handleError, authenticate } from '../middleware';
import {
  getUserAdressValidation,
  getAll,
  createAdressValidation,
  createAdress,
  updateAdressValidation,
  updateAdress,
  deleteAddressValidation,
  removeAddress,
  getByIdAddressValidation,
  getByIdAddress,
} from '../controller/userAddresses';

const router = Router();

const getAllAddress = (): Router =>
  router.get(
    '/',
    authenticate,
    validate(getUserAdressValidation, { context: true }),
    handleError(getAll()),
  );

const getAddressById = (): Router =>
  router.get(
    '/:id',
    authenticate,
    validate(getByIdAddressValidation, { context: true }),
    handleError(getByIdAddress()),
  );

const putUpdateAddress = (): Router =>
  router.put(
    '/:id',
    authenticate,
    validate(updateAdressValidation, { context: true }),
    handleError(updateAdress()),
  );

const postCreateAddress = (): Router =>
  router.post(
    '/',
    authenticate,
    validate(createAdressValidation, { context: true }),
    handleError(createAdress()),
  );

const deleteAddress = (): Router =>
  router.delete(
    '/:id',
    authenticate,
    validate(deleteAddressValidation, { context: true }),
    handleError(removeAddress()),
  );

export default (): Router =>
  router.use([
    deleteAddress(),
    getAllAddress(),
    getAddressById(),
    putUpdateAddress(),
    postCreateAddress(),
  ]);
