import { validate } from 'express-validation';
import { Router } from 'express';

import {
  allCustomer,
  allCustomerValidation,
  getUserValidation,
  getById,
  getCustomerOrdersValidation,
  getCustomerOrders,
  getAllCustomersOptions,
  deleteCustomerValidation,
  removeCustomer,
  restoreCustomerValidation,
  restoreCustomer,
} from '../controller/customers';

import { PropaneUserType } from '../constants';
import { authenticate, handleError, checkUserType } from '../middleware';

const router = Router();

const getAllCustomer = () =>
  router.get(
    '/',
    authenticate,
    validate(allCustomerValidation, { context: true }),
    handleError(allCustomer()),
  );

const getCustomerById = () =>
  router.get(
    '/:id',
    authenticate,
    checkUserType(
      PropaneUserType.ADMIN,
      PropaneUserType.SUB_ADMIN,
      PropaneUserType.VENDOR,
      PropaneUserType.USER,
    ),
    validate(getUserValidation, { context: true }),
    handleError(getById()),
  );

const getCustomerOrderList = () =>
  router.get(
    '/:id/orders',
    authenticate,
    validate(getCustomerOrdersValidation, { context: true }),
    handleError(getCustomerOrders()),
  );

const allCustomersOptions = (): Router =>
  router.get('/all/options', authenticate, handleError(getAllCustomersOptions()));

const deleteCustomer = (): Router =>
  router.delete(
    '/:id',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(deleteCustomerValidation),
    handleError(removeCustomer()),
  );

const patchRestoreCustomer = (): Router =>
  router.patch(
    '/restore/:id',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(restoreCustomerValidation),
    handleError(restoreCustomer()),
  );

export default (): Router =>
  router.use([
    deleteCustomer(),
    getAllCustomer(),
    getCustomerById(),
    allCustomersOptions(),
    getCustomerOrderList(),
    patchRestoreCustomer(),
  ]);
