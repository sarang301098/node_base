import { Router } from 'express';
import { validate } from 'express-validation';

import { handleError, authenticate, checkUserType } from '../middleware';
import {
  getZipCodesValidation,
  getAll,
  createZipCodeValidation,
  createZipCode,
  updateZipcodeValidation,
  updateZipcode,
  deleteZipcodeValidation,
  removeZipcode,
  getZipAll,
} from '../controller/zipcode';
import { PropaneUserType } from '../constants';

const router = Router();

const getAllZipcodes = (): Router =>
  router.get(
    '/',
    authenticate,
    validate(getZipCodesValidation, { context: true }),
    handleError(getAll()),
  );

const postCreateZipcode = (): Router =>
  router.post(
    '/',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(createZipCodeValidation, { context: true }),
    handleError(createZipCode()),
  );

const putUpdateZipcode = (): Router =>
  router.put(
    '/:id',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(updateZipcodeValidation, { context: true }),
    handleError(updateZipcode()),
  );

const deleteZipcode = (): Router =>
  router.delete(
    '/:id',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(deleteZipcodeValidation),
    handleError(removeZipcode()),
  );

const getAllZipcodesList = (): Router => router.get('/allZipCodes', handleError(getZipAll()));

export default (): Router =>
  router.use([
    getAllZipcodes(),
    postCreateZipcode(),
    putUpdateZipcode(),
    deleteZipcode(),
    getAllZipcodesList(),
  ]);
