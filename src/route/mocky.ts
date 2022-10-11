import { Router } from 'express';
import { validate } from 'express-validation';

import { handleError } from '../middleware';
import { getValidation, getAll } from '../controller/mocky';

const router = Router();

const getAllMocky = (): Router =>
  router.get('/', validate(getValidation, { context: true }), handleError(getAll()));

export default (): Router => router.use([getAllMocky()]);
