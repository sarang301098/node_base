import { Router } from 'express';
import { validate } from 'express-validation';

import { handleError, authenticate, checkUserType } from '../middleware';
import { PropaneUserType } from '../constants';
import {
  customersReport,
  getCustomerReportValidation,
  driverReport,
  getDriverReportValidation,
  vendorReport,
  getVendorReportValidation,
  productReport,
  getProductReportValidation,
  getInventoryReportValidation,
  invertoryStockReport,
  getOrdersReportValidation,
  ordersReport,
  getTranscationReportValidation,
  getTranscationReport,
  getGenerateReportValidation,
  generateReport,
} from '../controller/reports';

const router = Router();
const customerReports = (): Router =>
  router.get(
    '/customers',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(getCustomerReportValidation, { context: true }),
    handleError(customersReport()),
  );

const driverReports = (): Router =>
  router.get(
    '/drivers',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(getDriverReportValidation, { context: true }),
    handleError(driverReport()),
  );

const vendorReports = (): Router =>
  router.get(
    '/vendor',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(getVendorReportValidation, { context: true }),
    handleError(vendorReport()),
  );

const productReports = (): Router =>
  router.get(
    '/product',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(getProductReportValidation, { context: true }),
    handleError(productReport()),
  );

const inventoryStockReports = (): Router =>
  router.get(
    '/inventoryStock',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(getInventoryReportValidation, { context: true }),
    handleError(invertoryStockReport()),
  );

const ordersReports = (): Router =>
  router.get(
    '/ordersReport',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(getOrdersReportValidation, { context: true }),
    handleError(ordersReport()),
  );

const transactionsReports = (): Router =>
  router.get(
    '/transactions',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(getTranscationReportValidation, { context: true }),
    handleError(getTranscationReport()),
  );

const generateReports = (): Router =>
  router.post(
    '/generate',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN, PropaneUserType.VENDOR),
    validate(getGenerateReportValidation, { context: true }),
    handleError(generateReport()),
  );

export default (): Router =>
  router.use([
    driverReports(),
    vendorReports(),
    ordersReports(),
    productReports(),
    customerReports(),
    transactionsReports(),
    inventoryStockReports(),
    generateReports(),
  ]);
