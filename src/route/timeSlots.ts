import { Router } from 'express';
import { validate } from 'express-validation';

import { handleError, authenticate, checkUserType } from '../middleware';
import {
  getTimeSlotsValidation,
  getAll,
  createTimeSlotsManyValidation,
  createTimeSlotsMany,
  updateTimeSlotValidation,
  updateTimeSlot,
  deleteTimeSlotValidation,
  removeTimeSlot,
  getProductTimeSlotsValidation,
  getProductTimeSlots,
} from '../controller/timeSlots';
import { PropaneUserType } from '../constants';

const router = Router();

const getAllTimeSlots = (): Router =>
  router.get(
    '/',
    authenticate,
    validate(getTimeSlotsValidation, { context: true }),
    handleError(getAll()),
  );

const postCreateTimeSlotsMany = (): Router =>
  router.post(
    '/',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(createTimeSlotsManyValidation, { context: true }),
    handleError(createTimeSlotsMany()),
  );

const putUpdateTimeSlots = (): Router =>
  router.put(
    '/:id',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(updateTimeSlotValidation, { context: true }),
    handleError(updateTimeSlot()),
  );

const deleteTimeSlot = (): Router =>
  router.delete(
    '/:id',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(deleteTimeSlotValidation),
    handleError(removeTimeSlot()),
  );

const getProductTimeslot = (): Router =>
  router.get(
    '/product/all',
    authenticate,
    checkUserType(
      PropaneUserType.USER,
      PropaneUserType.ADMIN,
      PropaneUserType.VENDOR,
      PropaneUserType.SUB_ADMIN,
    ),
    validate(getProductTimeSlotsValidation),
    handleError(getProductTimeSlots()),
  );

export default (): Router =>
  router.use([
    getAllTimeSlots(),
    postCreateTimeSlotsMany(),
    putUpdateTimeSlots(),
    deleteTimeSlot(),
    getProductTimeslot(),
  ]);
