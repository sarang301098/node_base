import { Router } from 'express';
import { validate } from 'express-validation';
import { allDrivers, allDriversValidation } from '../controller/map';
import { authenticate, handleError } from '../middleware';

const router = Router();

const getAllDrivers = (): Router =>
  router.get(
    '/',
    authenticate,
    validate(allDriversValidation, { context: true }),
    handleError(allDrivers()),
  );

export default (): Router => router.use([getAllDrivers()]);
