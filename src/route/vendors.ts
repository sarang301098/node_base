import { Router } from 'express';
import { validate } from 'express-validation';

import { handleError, authenticate, checkUserType } from '../middleware';
import {
  addVendorValidation,
  addVendor,
  updateVendorValidation,
  updateVendor,
  getVendorByUserIdValidation,
  getVendorByUserId,
  getVendorsValidation,
  getAll,
  allCustomerList,
  allCustomerListValidation,
  deleteVendorValidation,
  removeVendors,
  createBankDetailsValidation,
  createBankDetails,
  getVendorsBankDetailsValidation,
  getvendorBankDetails,
  getvendorBankDetailsByIdValidation,
  getvendorBankDetailsById,
  getAllVendorOptions,
  getVendorsOrdersValidation,
  getVendorsOrders,
  removeVendorValidation,
  deleteVendors,
  restoreVendorValidation,
  restoreVendors,
  updateBankDetails,
  updateBankDetailsValidation,
  driverDetailValidation,
  driverDetails,
} from '../controller/vendors';
import { PropaneUserType } from '../constants';

const router = Router();

const getVendors = (): Router =>
  router.get(
    '/',
    authenticate,
    validate(getVendorsValidation, { context: true }),
    handleError(getAll()),
  );

const postCreateVendor = (): Router =>
  router.post(
    '/',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(addVendorValidation, { context: true }),
    handleError(addVendor()),
  );

const putUpdateVendor = (): Router =>
  router.put(
    '/:id',
    authenticate,
    checkUserType(PropaneUserType.VENDOR, PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(updateVendorValidation, { context: true }),
    handleError(updateVendor()),
  );

const getVendorByUser = (): Router =>
  router.get(
    '/user/:id',
    authenticate,
    validate(getVendorByUserIdValidation, { context: true }),
    handleError(getVendorByUserId()),
  );

const deleteVendor = (): Router =>
  router.delete(
    '/:id',
    authenticate,
    validate(deleteVendorValidation, { context: true }),
    handleError(removeVendors()),
  );

const getBankDetails = (): Router =>
  router.get(
    '/bankDetails',
    authenticate,
    checkUserType(PropaneUserType.VENDOR, PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(getVendorsBankDetailsValidation),
    handleError(getvendorBankDetails()),
  );

const getBankDetailsById = (): Router =>
  router.get(
    '/bankDetails/:id',
    authenticate,
    checkUserType(PropaneUserType.VENDOR, PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(getvendorBankDetailsByIdValidation),
    handleError(getvendorBankDetailsById()),
  );

const postCreateBankDetails = (): Router =>
  router.post(
    '/bankDetails',
    authenticate,
    checkUserType(PropaneUserType.VENDOR, PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(createBankDetailsValidation),
    handleError(createBankDetails()),
  );

const putBankDetails = (): Router =>
  router.put(
    '/bankDetails/:id',
    authenticate,
    checkUserType(PropaneUserType.VENDOR, PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(updateBankDetailsValidation),
    handleError(updateBankDetails()),
  );

const getVendorOrderList = () =>
  router.get(
    '/:id/orders',
    authenticate,
    validate(getVendorsOrdersValidation, { context: true }),
    handleError(getVendorsOrders()),
  );

const getCustomerList = (): Router =>
  router.get(
    '/all/customer',
    authenticate,
    validate(allCustomerListValidation, { context: true }),
    handleError(allCustomerList()),
  );

const allVendorOptions = (): Router =>
  router.get('/all/options', authenticate, handleError(getAllVendorOptions()));

const removeVendor = (): Router =>
  router.delete(
    '/remove/:id',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(removeVendorValidation, { context: true }),
    handleError(deleteVendors()),
  );

const restoreVendor = (): Router =>
  router.patch(
    '/restore/:id',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(restoreVendorValidation, { context: true }),
    handleError(restoreVendors()),
  );

const getdriverDetails = (): Router =>
  router.get(
    '/driver/:id',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN, PropaneUserType.VENDOR),
    validate(driverDetailValidation, { context: true }),
    handleError(driverDetails()),
  );

export default (): Router =>
  router.use([
    getVendors(),
    deleteVendor(),
    removeVendor(),
    restoreVendor(),
    putBankDetails(),
    getBankDetails(),
    getCustomerList(),
    putUpdateVendor(),
    getVendorByUser(),
    getdriverDetails(),
    postCreateVendor(),
    allVendorOptions(),
    getVendorOrderList(),
    getBankDetailsById(),
    postCreateBankDetails(),
  ]);
