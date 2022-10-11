import { Router } from 'express';

import { authenticate, handleError, checkUserType } from '../middleware';
import {
  createRating,
  getAll,
  createRatingValidation,
  getAllValidation,
} from '../controller/Ratings';

import { validate } from 'express-validation';
import { PropaneUserType } from '../constants';

const router = Router();

const getAllRating = () =>
  router.get(
    '/',
    authenticate,
    validate(getAllValidation, { context: true }),
    handleError(getAll()),
  );

const postCreateRating = () =>
  router.post(
    '/',
    authenticate,
    checkUserType(PropaneUserType.USER),
    validate(createRatingValidation, { context: true }),
    handleError(createRating()),
  );

export default (): Router => router.use([getAllRating(), postCreateRating()]);
