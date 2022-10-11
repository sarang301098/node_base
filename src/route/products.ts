import { Router } from 'express';
import { validate } from 'express-validation';

import { handleError, authenticate, checkUserType } from '../middleware';
import {
  createProductValidation,
  createProduct,
  getProductsValidation,
  getAll,
  updateProductValidation,
  updateProduct,
  deleteProductValidation,
  removeProduct,
  getProductsOfVendorsByZipcodeValidation,
  getProductsOfVendorsByZipcode,
  getProductByIdValidation,
  getProductById,
} from '../controller/products';

import { PropaneUserType } from '../constants';

const router = Router();

const getProducts = (): Router =>
  router.get(
    '/',
    authenticate,
    validate(getProductsValidation, { context: true }),
    handleError(getAll()),
  );

const postCreateProduct = (): Router =>
  router.post(
    '/',
    authenticate,
    validate(createProductValidation, { context: true }),
    handleError(createProduct()),
  );

const putUpdateProduct = (): Router =>
  router.put(
    '/:id',
    authenticate,
    validate(updateProductValidation, { context: true }),
    handleError(updateProduct()),
  );

const deleteUpdateProduct = (): Router =>
  router.delete(
    '/:id',
    authenticate,
    validate(deleteProductValidation, { context: true }),
    handleError(removeProduct()),
  );

const getProductOfVendorsByZipcode = (): Router =>
  router.get(
    '/vendors/byZipcode',
    authenticate,
    checkUserType(PropaneUserType.USER),
    validate(getProductsOfVendorsByZipcodeValidation, { context: true }),
    handleError(getProductsOfVendorsByZipcode()),
  );

const getByIdProduct = (): Router =>
  router.get(
    '/:id',
    authenticate,
    validate(getProductByIdValidation, { context: true }),
    handleError(getProductById()),
  );

export default (): Router =>
  router.use([
    getProducts(),
    getByIdProduct(),
    putUpdateProduct(),
    postCreateProduct(),
    deleteUpdateProduct(),
    getProductOfVendorsByZipcode(),
  ]);
