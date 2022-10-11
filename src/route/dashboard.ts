import { Router } from 'express';
import { validate } from 'express-validation';
import { handleError, authenticate, checkUserType } from '../middleware';

import {
  getVendorDashboard,
  getAdminDashboard,
  getAdminDashboardOrdersValidation,
  getAdminDashboardOrders,
  getDriverDashborad,
} from '../controller/dashboard';
import { PropaneUserType } from '../constants';

const router = Router();

const vendorsDashboard = (): Router =>
  router.get(
    '/vendor',
    authenticate,
    checkUserType(PropaneUserType.VENDOR, PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    handleError(getVendorDashboard()),
  );

const adminsDashboard = (): Router =>
  router.get(
    '/admin',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    handleError(getAdminDashboard()),
  );

const adminDashboardOrders = (): Router =>
  router.get(
    '/admin/orders',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(getAdminDashboardOrdersValidation, { context: true }),
    handleError(getAdminDashboardOrders()),
  );

const driverDashboard = (): Router =>
  router.get(
    '/driver',
    authenticate,
    checkUserType(PropaneUserType.DRIVER, PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    handleError(getDriverDashborad()),
  );

export default (): Router =>
  router.use([vendorsDashboard(), adminsDashboard(), adminDashboardOrders(), driverDashboard()]);
