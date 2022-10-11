import { Router } from 'express';
import { validate } from 'express-validation';

import { handleError, authenticate, checkUserType } from '../middleware';
import {
  getCart,
  createCartValidation,
  createCart,
  updateCartValidation,
  updateCart,
  removeCartValidation,
  removeCart,
} from '../controller/cart';
import { PropaneUserType } from '../constants';

const router = Router();

const getCartByUser = (): Router =>
  router.get(
    '/',
    authenticate,
    checkUserType(PropaneUserType.USER, PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    handleError(getCart()),
  );

const postCreateCart = (): Router =>
  router.post(
    '/',
    authenticate,
    checkUserType(PropaneUserType.USER, PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(createCartValidation, { context: true }),
    handleError(createCart()),
  );

const putUpdateCart = (): Router =>
  router.put(
    '/:id',
    authenticate,
    checkUserType(PropaneUserType.USER, PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(updateCartValidation, { context: true }),
    handleError(updateCart()),
  );

const deleteCart = (): Router =>
  router.delete(
    '/:id',
    authenticate,
    checkUserType(PropaneUserType.USER, PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(removeCartValidation, { context: true }),
    handleError(removeCart()),
  );

export default (): Router =>
  router.use([getCartByUser(), postCreateCart(), putUpdateCart(), deleteCart()]);
