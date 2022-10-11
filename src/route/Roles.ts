import { Router } from 'express';
import { validate } from 'express-validation';

import { handleError, authenticate, checkUserType } from '../middleware';
import {
  getRoleValidation,
  getAll,
  getByIdRole,
  getByIdRoleValidation,
  createRole,
  createRoleValidation,
  updateRoleValidation,
  updateRole,
  deleteRoleValidation,
  removeRole,
  getRoleOptions,
} from '../controller/Roles';
import { PropaneUserType } from '../constants';

const router = Router();

const getAllRole = (): Router =>
  router.get(
    '/',
    authenticate,
    validate(getRoleValidation, { context: true }),
    handleError(getAll()),
  );

const getByIdRoles = (): Router =>
  router.get(
    '/:id',
    authenticate,
    validate(getByIdRoleValidation, { context: true }),
    handleError(getByIdRole()),
  );

const postCreateRole = (): Router =>
  router.post(
    '/',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(createRoleValidation, { context: true }),
    handleError(createRole()),
  );

const putUpdateRole = (): Router =>
  router.put(
    '/:id',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(updateRoleValidation, { context: true }),
    handleError(updateRole()),
  );

const deleteRole = (): Router =>
  router.delete(
    '/:id',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(deleteRoleValidation, { context: true }),
    handleError(removeRole()),
  );

const getAllRoleOptions = (): Router =>
  router.get('/all/options', authenticate, handleError(getRoleOptions()));

export default (): Router =>
  router.use([
    getAllRole(),
    getByIdRoles(),
    deleteRole(),
    postCreateRole(),
    putUpdateRole(),
    getAllRoleOptions(),
  ]);
