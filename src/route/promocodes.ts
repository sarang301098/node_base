import { Router } from 'express';
import { validate } from 'express-validation';

import { handleError, authenticate, checkUserType } from '../middleware';
import {
  getPromocodesValidation,
  getAll,
  createPromocodeValidation,
  createPromocode,
  updatePromocodeValidation,
  updatePromocode,
  deletePromocodeValidation,
  removePromocode,
  checkPromocodeValidation,
  checkPromocode,
  getPromocodeByIdValidation,
  getById,
  applyPromocodeValidation,
  applyPromocode,
} from '../controller/promocodes';
import { PropaneUserType } from '../constants';

const router = Router();

const getAllPromocodes = (): Router =>
  router.get(
    '/',
    authenticate,
    validate(getPromocodesValidation, { context: true }),
    handleError(getAll()),
  );

const postCreatePromocode = (): Router =>
  router.post(
    '/',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(createPromocodeValidation, { context: true }),
    handleError(createPromocode()),
  );

const putUpdatePromocode = (): Router =>
  router.put(
    '/:id',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(updatePromocodeValidation, { context: true }),
    handleError(updatePromocode()),
  );

const deletePromocode = (): Router =>
  router.delete(
    '/:id',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(deletePromocodeValidation),
    handleError(removePromocode()),
  );

const postCheckPromocode = (): Router =>
  router.post(
    '/check',
    authenticate,
    validate(checkPromocodeValidation, { context: true }),
    handleError(checkPromocode()),
  );

const patchApplyPromocode = (): Router =>
  router.patch(
    '/apply',
    authenticate,
    validate(applyPromocodeValidation, { context: true }),
    handleError(applyPromocode()),
  );

const getByIdPromocodes = (): Router =>
  router.get(
    '/:id',
    authenticate,
    validate(getPromocodeByIdValidation, { context: true }),
    handleError(getById()),
  );

export default (): Router =>
  router.use([
    deletePromocode(),
    getAllPromocodes(),
    getByIdPromocodes(),
    postCheckPromocode(),
    putUpdatePromocode(),
    postCreatePromocode(),
    patchApplyPromocode(),
  ]);
