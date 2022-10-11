import { Router } from 'express';
import { validate } from 'express-validation';

import { handleError, authenticate, checkUserType } from '../middleware';
import {
  getStatesValidation,
  getAll,
  createStateValidation,
  createState,
  updateStateValidation,
  updateState,
  deleteStateValidation,
  removeState,
} from '../controller/state';
import { PropaneUserType } from '../constants';

const router = Router();

const getAllStates = (): Router =>
  router.get(
    '/',
    authenticate,
    validate(getStatesValidation, { context: true }),
    handleError(getAll()),
  );

const postCreateState = (): Router =>
  router.post(
    '/',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(createStateValidation, { context: true }),
    handleError(createState()),
  );

const putUpdateState = (): Router =>
  router.put(
    '/:id',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(updateStateValidation, { context: true }),
    handleError(updateState()),
  );

const deleteState = (): Router =>
  router.delete(
    '/:id',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(deleteStateValidation),
    handleError(removeState()),
  );

export default (): Router =>
  router.use([getAllStates(), postCreateState(), putUpdateState(), deleteState()]);
