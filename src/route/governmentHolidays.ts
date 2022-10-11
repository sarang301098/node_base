import { Router } from 'express';
import { validate } from 'express-validation';

import { handleError, authenticate, checkUserType } from '../middleware';
import {
  getAll,
  getgovernmentHolidayValidation,
  getIdGovernmentHoliday,
  getByIdGovernmentHolidayValidation,
  createGovernmentHolidayValidation,
  createGovernmentHoliday,
  updateGovernmentHoliday,
  updateGovernmentHolidayValidation,
  deleteGovernmentHolidayValidation,
  removeGovernmentHoliday,
} from '../controller/GovernmentHolidays';
import { PropaneUserType } from '../constants';

const router = Router();

const getAllGovernmentHoliday = (): Router =>
  router.get(
    '/',
    authenticate,
    validate(getgovernmentHolidayValidation, { context: true }),
    handleError(getAll()),
  );

const getByIdGovernmentHoliday = (): Router =>
  router.get(
    '/:id',
    authenticate,
    validate(getByIdGovernmentHolidayValidation, { context: true }),
    handleError(getIdGovernmentHoliday()),
  );

const postCreateGovernmentHoliday = (): Router =>
  router.post(
    '/',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(createGovernmentHolidayValidation, { context: true }),
    handleError(createGovernmentHoliday()),
  );

const putUpdateGovernmentHoliday = (): Router =>
  router.put(
    '/:id',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(updateGovernmentHolidayValidation, { context: true }),
    handleError(updateGovernmentHoliday()),
  );

const deleteGovernmentHoliday = (): Router =>
  router.delete(
    '/:id',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(deleteGovernmentHolidayValidation),
    handleError(removeGovernmentHoliday()),
  );

export default (): Router =>
  router.use([
    getAllGovernmentHoliday(),
    getByIdGovernmentHoliday(),
    postCreateGovernmentHoliday(),
    putUpdateGovernmentHoliday(),
    deleteGovernmentHoliday(),
  ]);
