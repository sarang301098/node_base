import { Router } from 'express';
import { validate } from 'express-validation';

import { handleError, authenticate } from '../middleware';
import {
  getTransactionsValidation,
  getAll,
  freelancerTranscationDashbord,
  freelancerTranscationDashbordValidation,
  vendorTranscationDashbordValidation,
  vendorTranscation,
} from '../controller/transactions';

const router = Router();

const getAllTransactions = (): Router =>
  router.get(
    '/',
    authenticate,
    validate(getTransactionsValidation, { context: true }),
    handleError(getAll()),
  );

const getFreelancerTranscationDashbord = (): Router =>
  router.get(
    '/freelancer',
    authenticate,
    validate(freelancerTranscationDashbordValidation, { context: true }),
    handleError(freelancerTranscationDashbord()),
  );

const getVendortranscationDashbord = (): Router =>
  router.get(
    '/vendorTransaction',
    authenticate,
    validate(vendorTranscationDashbordValidation, { context: true }),
    handleError(vendorTranscation()),
  );

export default (): Router =>
  router.use([
    getAllTransactions(),
    getFreelancerTranscationDashbord(),
    getVendortranscationDashbord(),
  ]);
