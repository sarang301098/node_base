import { Router } from 'express';
import { validate } from 'express-validation';
import { handleError, authenticate, checkUserType } from '../middleware';
import {
  updateDriverLocation,
  updateDriverLocationValidation,
  getDriverValidation,
  getAll,
  createDriverValidation,
  createDriver,
  removeDriver,
  deleteDriverValidation,
  cancelOrderValidation,
  cancelOrder,
  listCancellationReason,
  getAllDriverOptionsValodation,
  getAllDriverOptions,
  getDriversOrdersValidation,
  getDriversOrders,
  getDriverProfileByIdValidation,
  getDriverProfileById,
  getFreelanceDriverPaymentValidation,
  getFreelanceDriverPayments,
  driverLocationValidation,
  driverLocation,
  updateDriverStatusValidation,
  updateDriveratus,
  driverSwipeOrder,
  driverSwipeOrderValidation,
  driversList,
  emergencyOrder,
  cancellOrderList,
  todaysOrder,
  updateDriverActivation,
  updateDriverActivationValidation,
} from '../controller/drivers';
import { PropaneUserType } from '../constants';

const router = Router();

const getAllDriver = (): Router =>
  router.get(
    '/',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN, PropaneUserType.VENDOR),
    validate(getDriverValidation, { context: true }),
    handleError(getAll()),
  );

const postCreateDriver = (): Router =>
  router.post(
    '/',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN, PropaneUserType.VENDOR),
    validate(createDriverValidation, { context: true }),
    handleError(createDriver()),
  );

const deleteDriver = (): Router =>
  router.delete(
    '/:id',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN, PropaneUserType.VENDOR),
    validate(deleteDriverValidation, { context: true }),
    handleError(removeDriver()),
  );

const getCancelOrder = (): Router =>
  router.get('/cancel', authenticate, handleError(listCancellationReason()));

const postCancelOrder = (): Router =>
  router.post(
    '/cancel',
    authenticate,
    validate(cancelOrderValidation, { context: true }),
    handleError(cancelOrder()),
  );

const putupdateDriverLocation = () =>
  router.put(
    '/location/:id',
    authenticate,
    checkUserType(
      PropaneUserType.ADMIN,
      PropaneUserType.SUB_ADMIN,
      PropaneUserType.VENDOR,
      PropaneUserType.DRIVER,
    ),
    validate(updateDriverLocationValidation, { context: true }),
    handleError(updateDriverLocation()),
  );

const getDriverOptions = (): Router =>
  router.get(
    '/all/options',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN, PropaneUserType.VENDOR),
    validate(getAllDriverOptionsValodation, { context: true }),
    handleError(getAllDriverOptions()),
  );

const getDriverOrderList = () =>
  router.get(
    '/:id/orders',
    authenticate,
    validate(getDriversOrdersValidation, { context: true }),
    handleError(getDriversOrders()),
  );

const getDriverById = () =>
  router.get(
    '/profile/:id',
    authenticate,
    validate(getDriverProfileByIdValidation, { context: true }),
    handleError(getDriverProfileById()),
  );

const getFreelanceDriverPayment = (): Router =>
  router.get(
    '/freelance/payment',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN, PropaneUserType.VENDOR),
    validate(getFreelanceDriverPaymentValidation, { context: true }),
    handleError(getFreelanceDriverPayments()),
  );

const getDriverLocation = (): Router =>
  router.get(
    '/location/:id',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN, PropaneUserType.VENDOR),
    validate(driverLocationValidation, { context: true }),
    handleError(driverLocation()),
  );

const putupdateStatus = () =>
  router.put(
    '/status',
    authenticate,
    checkUserType(
      PropaneUserType.ADMIN,
      PropaneUserType.SUB_ADMIN,
      PropaneUserType.VENDOR,
      PropaneUserType.DRIVER,
    ),
    validate(updateDriverStatusValidation, { context: true }),
    handleError(updateDriveratus()),
  );

const putDriverSwipeOrder = () =>
  router.put(
    '/swipe',
    authenticate,
    validate(driverSwipeOrderValidation),
    handleError(driverSwipeOrder()),
  );

const getDriverList = (): Router =>
  router.get(
    '/list',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN, PropaneUserType.VENDOR),
    handleError(driversList()),
  );

const putEmergencyOrder = () =>
  router.put(
    '/emergency-order',
    authenticate,
    checkUserType(PropaneUserType.DRIVER),
    handleError(emergencyOrder()),
  );

const cancelledOrderList = (): Router =>
  router.get('/cancelledlist', authenticate, handleError(cancellOrderList()));

const getTodaysOrder = () =>
  router.get(
    '/todays-order',
    authenticate,
    checkUserType(PropaneUserType.DRIVER),
    handleError(todaysOrder()),
  );

const putupdateActive = () =>
  router.put(
    '/activation',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN, PropaneUserType.VENDOR),
    validate(updateDriverActivationValidation, { context: true }),
    handleError(updateDriverActivation()),
  );

export default (): Router =>
  router.use([
    getAllDriver(),
    deleteDriver(),
    getDriverById(),
    getCancelOrder(),
    postCancelOrder(),
    putupdateStatus(),
    postCreateDriver(),
    getDriverOptions(),
    getDriverLocation(),
    getDriverOrderList(),
    putDriverSwipeOrder(),
    putupdateDriverLocation(),
    getFreelanceDriverPayment(),
    putupdateStatus(),
    getDriverList(),
    putEmergencyOrder(),
    cancelledOrderList(),
    getTodaysOrder(),
    putupdateActive(),
  ]);
