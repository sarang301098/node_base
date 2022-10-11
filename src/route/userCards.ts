import { Router } from 'express';
import { validate } from 'express-validation';

import { handleError, authenticate } from '../middleware';
import {
  createUsersCardValidation,
  createUsersCard,
  updateUsersCardValidation,
  updateUsersCard,
  deleteUsersCardValidation,
  deleteUsersCard,
  getUsersCardByIdValidation,
  getUsersCardById,
  getAllValidation,
  getAll,
} from '../controller/userCards';

const router = Router();

const getCards = (): Router =>
  router.get(
    '/',
    authenticate,
    validate(getAllValidation, { context: true }),
    handleError(getAll()),
  );

const getCardById = (): Router =>
  router.get(
    '/:id',
    authenticate,
    validate(getUsersCardByIdValidation, { context: true }),
    handleError(getUsersCardById()),
  );

const putUpdateCard = (): Router =>
  router.put(
    '/:id',
    authenticate,
    validate(updateUsersCardValidation, { context: true }),
    handleError(updateUsersCard()),
  );

const postCreateCard = (): Router =>
  router.post(
    '/',
    authenticate,
    validate(createUsersCardValidation, { context: true }),
    handleError(createUsersCard()),
  );

const deleteCard = (): Router =>
  router.delete(
    '/:id',
    authenticate,
    validate(deleteUsersCardValidation, { context: true }),
    handleError(deleteUsersCard()),
  );

export default (): Router =>
  router.use([getCards(), getCardById(), putUpdateCard(), postCreateCard(), deleteCard()]);
