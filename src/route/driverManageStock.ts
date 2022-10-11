import { Router } from 'express';
import { validate } from 'express-validation';
import { PropaneUserType } from '../constants';
import {
  getAllDriverValidation,
  getAllDriver,
  driverDetails,
  driverDetailsValidation,
  returnAddStock,
  returnAddStockValidation,
  allStockList,
  getDriverStocksValidation,
  driverUpdateStockList,
} from '../controller/driverManageStock';
import { authenticate, checkUserType, handleError } from '../middleware';

const router = Router();

const getAll = (): Router =>
  router.get(
    '/',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN, PropaneUserType.VENDOR),
    validate(getAllDriverValidation, { context: true }),
    handleError(getAllDriver()),
  );

const getDriverDetails = (): Router =>
  router.get(
    '/details',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN, PropaneUserType.VENDOR),
    validate(driverDetailsValidation, { context: true }),
    handleError(driverDetails()),
  );

const postReturnAddStock = (): Router =>
  router.post(
    '/',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN, PropaneUserType.VENDOR),
    validate(returnAddStockValidation, { context: true }),
    handleError(returnAddStock()),
  );

const getDriverStock = (): Router =>
  router.get(
    '/stock',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN, PropaneUserType.VENDOR),
    validate(getDriverStocksValidation, { context: true }),
    handleError(allStockList()),
  );

const getDriverUpdateStockList = (): Router =>
  router.get('/updateStock', authenticate, handleError(driverUpdateStockList()));
export default (): Router =>
  router.use([
    getAll(),
    getDriverDetails(),
    postReturnAddStock(),
    getDriverStock(),
    getDriverUpdateStockList(),
  ]);
