import { Router } from 'express';
import { validate } from 'express-validation';

import { handleError, authenticate } from '../middleware';
import { createPaymentValidation, createPayment, testLodash } from '../controller/testPayment';

const router = Router();

const postCreatePayment = (): Router =>
  router.post(
    '/',
    authenticate,
    validate(createPaymentValidation, { context: true }),
    handleError(createPayment()),
  );

const postTestLodash = (): Router => router.post('/lodash', handleError(testLodash()));

export default (): Router => router.use([postCreatePayment(), postTestLodash()]);
