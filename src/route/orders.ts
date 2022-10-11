import { Router } from 'express';
import { validate } from 'express-validation';

import { handleError, authenticate, checkUserType } from '../middleware';
import {
  createOrderValidation,
  createOrder,
  updateOrderValidation,
  updateOrder,
  getUsersOrderValidation,
  getUsersOrder,
  getOrderByIdValidation,
  getOrderById,
  deleteOrdersValidation,
  removeOrders,
  restoreOrdersValidation,
  restoreOrders,
  orderReschedule,
  orderRescheduleValidation,
  getAllrdersValidation,
  getAllOrders,
} from '../controller/orders';

import { PropaneUserType } from '../constants';

const router = Router();

const getAll = (): Router =>
  router.get(
    '/',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(getAllrdersValidation, { context: true }),
    handleError(getAllOrders()),
  );

const getUserOrders = (): Router =>
  router.get(
    '/users',
    authenticate,
    checkUserType(PropaneUserType.USER, PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(getUsersOrderValidation, { context: true }),
    handleError(getUsersOrder()),
  );

const orderById = (): Router =>
  router.get(
    '/byId/:id',
    authenticate,
    validate(getOrderByIdValidation, { context: true }),
    handleError(getOrderById()),
  );

const postCreateOrder = (): Router =>
  router.post(
    '/',
    authenticate,
    checkUserType(PropaneUserType.USER, PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(createOrderValidation, { context: true }),
    handleError(createOrder()),
  );

const putUpdateOrder = (): Router =>
  router.put(
    '/:id',
    authenticate,
    checkUserType(PropaneUserType.USER, PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(updateOrderValidation, { context: true }),
    handleError(updateOrder()),
  );

const deleteOrder = (): Router =>
  router.delete(
    '/:id',
    authenticate,
    checkUserType(PropaneUserType.USER, PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(deleteOrdersValidation, { context: true }),
    handleError(removeOrders()),
  );

const restoreOrder = (): Router =>
  router.patch(
    '/restore/:id',
    authenticate,
    checkUserType(PropaneUserType.USER, PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(restoreOrdersValidation, { context: true }),
    handleError(restoreOrders()),
  );

const petchOrderReschedule = (): Router =>
  router.patch(
    '/reschedule/:id',
    authenticate,
    checkUserType(
      PropaneUserType.USER,
      PropaneUserType.VENDOR,
      PropaneUserType.ADMIN,
      PropaneUserType.SUB_ADMIN,
    ),
    validate(orderRescheduleValidation, { context: true }),
    handleError(orderReschedule()),
  );

export default (): Router =>
  router.use([
    getAll(),
    orderById(),
    deleteOrder(),
    restoreOrder(),
    getUserOrders(),
    putUpdateOrder(),
    postCreateOrder(),
    petchOrderReschedule(),
  ]);
