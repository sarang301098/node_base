import { Router } from 'express';
import { validate } from 'express-validation';

import { handleError, authenticate, checkUserType } from '../middleware';
import {
  getAllValidation,
  getAll,
  createVendorProductValidation,
  createVendorProducts,
  updateVendorProductPricingTiersValidation,
  updateVendorProductPricingTiers,
  addProductPricingValidation,
  addProductPricing,
  deleteVendorProductPricingValidation,
  removeVendorProductPricing,
  deleteVendorProductValidation,
  removeVendorProduct,
  updateVendorProductValidation,
  updateVendorProducts,
  updateProductPricingValidation,
  updateProductPricing,
  getproductPricingValidation,
  getproductPricing,
  getAppProductPricingValidation,
  getAppProductPricing,
} from '../controller/vendorProducts';

import { PropaneUserType } from '../constants';

const router = Router();

const getVendorProducts = (): Router =>
  router.get(
    '/',
    authenticate,
    validate(getAllValidation, { context: true }),
    handleError(getAll()),
  );

const postCreateVendorProduct = (): Router =>
  router.post(
    '/',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(createVendorProductValidation, { context: true }),
    handleError(createVendorProducts()),
  );

const putUpdateVendorProduct = (): Router =>
  router.put(
    '/:id',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(updateVendorProductValidation, { context: true }),
    handleError(updateVendorProducts()),
  );

const patchVendorProduct = (): Router =>
  router.patch(
    '/tiers',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(updateVendorProductPricingTiersValidation, { context: true }),
    handleError(updateVendorProductPricingTiers()),
  );

const postCreateVendorProductPricing = (): Router =>
  router.post(
    '/pricing',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(addProductPricingValidation, { context: true }),
    handleError(addProductPricing()),
  );

const deleteVendorProductPricing = (): Router =>
  router.delete(
    '/pricing',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(deleteVendorProductPricingValidation, { context: true }),
    handleError(removeVendorProductPricing()),
  );

const deleteVendorProduct = (): Router =>
  router.delete(
    '/:id',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(deleteVendorProductValidation, { context: true }),
    handleError(removeVendorProduct()),
  );

const patchVendorProductPricing = (): Router =>
  router.patch(
    '/pricing',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(updateProductPricingValidation, { context: true }),
    handleError(updateProductPricing()),
  );

const getAllProductPricing = (): Router =>
  router.get(
    '/all/productPricing',
    authenticate,
    validate(getproductPricingValidation, { context: true }),
    handleError(getproductPricing()),
  );

const getAppPricing = (): Router =>
  router.get(
    '/app/productPricing',
    authenticate,
    validate(getAppProductPricingValidation, { context: true }),
    handleError(getAppProductPricing()),
  );

export default (): Router =>
  router.use([
    postCreateVendorProductPricing(),
    deleteVendorProductPricing(),
    patchVendorProductPricing(),
    postCreateVendorProduct(),
    putUpdateVendorProduct(),
    getAllProductPricing(),
    deleteVendorProduct(),
    patchVendorProduct(),
    getVendorProducts(),
    getAppPricing(),
  ]);
