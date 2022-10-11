import { Router } from 'express';
import { validate } from 'express-validation';
import { PropaneUserType } from '../constants';
import {
  addStock,
  addStockValidation,
  productList,
  productListValidation,
  productDetails,
  productDetailsValidation,
  vendorStockHistory,
  vendorStockHistoryValidation,
  vendorStockHistoryApp,
  vendorStockHistoryAppValidation,
  productDownList,
  productDownListValidation,
  cylinderSizeList,
  cylinderSizeListValidation,
  updateLowStockValidation,
  updateLowStock,
} from '../controller/vendorMangeStock';
import { authenticate, checkUserType, handleError } from '../middleware';
const router = Router();

const getProductList = (): Router =>
  router.get(
    '/',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN, PropaneUserType.VENDOR),
    validate(productListValidation, { context: true }),
    handleError(productList()),
  );

const postAddStock = (): Router =>
  router.post(
    '/',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN, PropaneUserType.VENDOR),
    validate(addStockValidation, { context: true }),
    handleError(addStock()),
  );

const getProductDetails = (): Router =>
  router.get(
    '/details',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN, PropaneUserType.VENDOR),
    validate(productDetailsValidation, { context: true }),
    handleError(productDetails()),
  );

const getVendorStockHistory = (): Router =>
  router.get(
    '/history',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN, PropaneUserType.VENDOR),
    validate(vendorStockHistoryValidation, { context: true }),
    handleError(vendorStockHistory()),
  );

const getVendorStockHistoryApp = (): Router =>
  router.get(
    '/historyApp',
    authenticate,
    validate(vendorStockHistoryAppValidation),
    handleError(vendorStockHistoryApp()),
  );

const getProductDownList = (): Router =>
  router.get(
    '/dropDown',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN, PropaneUserType.VENDOR),
    validate(productDownListValidation, { context: true }),
    handleError(productDownList()),
  );

const getCylinderSizeDownList = (): Router =>
  router.get(
    '/size',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN, PropaneUserType.VENDOR),
    validate(cylinderSizeListValidation, { context: true }),
    handleError(cylinderSizeList()),
  );

const putupdateLowStockReminder = () =>
  router.put(
    '/lowStock',
    authenticate,
    validate(updateLowStockValidation, { context: true }),
    handleError(updateLowStock()),
  );
export default (): Router =>
  router.use([
    postAddStock(),
    getProductList(),
    getProductDetails(),
    getVendorStockHistory(),
    getVendorStockHistoryApp(),
    getProductDownList(),
    getCylinderSizeDownList(),
    putupdateLowStockReminder(),
  ]);
