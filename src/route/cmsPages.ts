import { Router } from 'express';
import { validate } from 'express-validation';

import { handleError, authenticate } from '../middleware';
import {
  createCmsValidation,
  createCms,
  getCmsValidation,
  getAll,
  updateCmsValidation,
  updateCms,
  getByIdCmsValidation,
  getByIdCms,
  deleteCmsValidation,
  removeCms,
  getSingleCmsValidation,
  getSingle,
} from '../controller/cms';

const router = Router();

const getAllCms = (): Router =>
  router.get('/', validate(getCmsValidation, { context: true }), handleError(getAll()));

const getSingleCms = (): Router =>
  router.get(
    '/single/get-by-key',
    validate(getSingleCmsValidation, { context: true }),
    handleError(getSingle()),
  );

const postCreateCms = (): Router =>
  router.post(
    '/',
    authenticate,
    validate(createCmsValidation, { context: true }),
    handleError(createCms()),
  );

const getCmsById = (): Router =>
  router.get(
    '/:id',
    // authenticate,
    validate(getByIdCmsValidation, { context: true }),
    handleError(getByIdCms()),
  );

const putupdateCms = (): Router =>
  router.put(
    '/:id',
    // authenticate,
    validate(updateCmsValidation, { context: true }),
    handleError(updateCms()),
  );

const deleteCms = (): Router =>
  router.delete('/:id', authenticate, validate(deleteCmsValidation), handleError(removeCms()));

export default (): Router =>
  router.use([
    getAllCms(),
    deleteCms(),
    getCmsById(),
    putupdateCms(),
    getSingleCms(),
    postCreateCms(),
  ]);
