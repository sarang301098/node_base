import { Router } from 'express';
import { validate } from 'express-validation';
import { handleError, authenticate } from '../middleware';

import {
  getVendorsEarning,
  getVendorEarningValidation,
  getAdmincancelledEarningValidation,
  getAdmincancelledEarning,
} from '../controller/earnings';

const router = Router();

const earningDetails = (): Router =>
  router.get(
    '/net',
    authenticate,
    validate(getVendorEarningValidation, { context: true }),
    handleError(getVendorsEarning()),
  );

const cancelledOrderEarning = (): Router =>
  router.get(
    '/cancelled',
    authenticate,
    validate(getAdmincancelledEarningValidation, { context: true }),
    handleError(getAdmincancelledEarning()),
  );

export default (): Router => router.use([earningDetails(), cancelledOrderEarning()]);
