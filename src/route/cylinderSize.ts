import { Router } from 'express';
import { validate } from 'express-validation';

import { handleError, authenticate } from '../middleware';
import {
  getCylinderSizesValidation,
  getAll,
  createCylinderSizeValidation,
  createCylinderSize,
  updateCylinderSizeValidation,
  updateCylinderSize,
  deleteCylinderSizeValidation,
  removeCylinderSize,
  getByVendorsProductValidation,
  getByVendorsProduct,
} from '../controller/cylinderSize';

const router = Router();

const getAllCylinderSize = (): Router =>
  router.get(
    '/',
    authenticate,
    validate(getCylinderSizesValidation, { context: true }),
    handleError(getAll()),
  );

const postcreateCylinderSize = (): Router =>
  router.post(
    '/',
    authenticate,
    validate(createCylinderSizeValidation, { context: true }),
    handleError(createCylinderSize()),
  );

const putupdateCylinderSize = (): Router =>
  router.put(
    '/:id',
    authenticate,
    validate(updateCylinderSizeValidation, { context: true }),
    handleError(updateCylinderSize()),
  );

const deleteCylinderSize = (): Router =>
  router.delete(
    '/:id',
    authenticate,
    validate(deleteCylinderSizeValidation),
    handleError(removeCylinderSize()),
  );

const getAllByVendorProduct = (): Router =>
  router.get(
    '/vendors/all',
    authenticate,
    validate(getByVendorsProductValidation, { context: true }),
    handleError(getByVendorsProduct()),
  );

export default (): Router =>
  router.use([
    getAllByVendorProduct(),
    getAllCylinderSize(),
    postcreateCylinderSize(),
    putupdateCylinderSize(),
    deleteCylinderSize(),
  ]);
