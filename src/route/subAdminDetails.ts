import { Router } from 'express';
import { validate } from 'express-validation';

import { handleError, authenticate, checkUserType } from '../middleware';
import {
  getSubAdminsUserValidation,
  getAll,
  getByIdSubAdminValidation,
  getById,
  createSubAdminDetailsValidation,
  createSubAdminDetails,
  updateSubAdminDetailsValidation,
  updateSubAdminDetails,
  deleteSubAdminDetailsValidation,
  removeSubAdminDetails,
  updateSubAdminStaus,
  updateSubAdminStatusValidation,
} from '../controller/subAdminDetails';
import { PropaneUserType } from '../constants';

const router = Router();

const getSubAdminUserDetails = (): Router =>
  router.get(
    '/',
    authenticate,
    validate(getSubAdminsUserValidation, { context: true }),
    handleError(getAll()),
  );

const getByIdSubAdminUserDetails = (): Router =>
  router.get(
    '/:id',
    authenticate,
    validate(getByIdSubAdminValidation, { context: true }),
    handleError(getById()),
  );

const postCreateSubAdminDetails = (): Router =>
  router.post(
    '/',
    authenticate,
    checkUserType(PropaneUserType.ADMIN),
    validate(createSubAdminDetailsValidation, { context: true }),
    handleError(createSubAdminDetails()),
  );

const putUpdateSubAdminDetails = (): Router =>
  router.put(
    '/:id',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(updateSubAdminDetailsValidation, { context: true }),
    handleError(updateSubAdminDetails()),
  );

const deleteUpdateSubAdminDetails = (): Router =>
  router.delete(
    '/:id',
    authenticate,
    checkUserType(PropaneUserType.ADMIN),
    validate(deleteSubAdminDetailsValidation, { context: true }),
    handleError(removeSubAdminDetails()),
  );

const putUpdateSubAdminStatus = (): Router =>
  router.put(
    '/subadmin/status/:id',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(updateSubAdminStatusValidation, { context: true }),
    handleError(updateSubAdminStaus()),
  );

export default (): Router =>
  router.use([
    getSubAdminUserDetails(),
    getByIdSubAdminUserDetails(),
    postCreateSubAdminDetails(),
    putUpdateSubAdminDetails(),
    deleteUpdateSubAdminDetails(),
    putUpdateSubAdminStatus(),
  ]);
