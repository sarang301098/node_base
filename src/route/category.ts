import { Router } from 'express';
import { validate } from 'express-validation';

import { handleError, authenticate } from '../middleware';
import {
  createCategoryValidation,
  createCategory,
  getCategoriesValidation,
  getAll,
  updateCategoryValidation,
  updateCategory,
  deleteCategoryValidation,
  removeCategory,
} from '../controller/categories';

const router = Router();

const getAllCategories = (): Router =>
  router.get(
    '/',
    authenticate,
    validate(getCategoriesValidation, { context: true }),
    handleError(getAll()),
  );

const postCreateCategory = (): Router =>
  router.post(
    '/',
    authenticate,
    validate(createCategoryValidation, { context: true }),
    handleError(createCategory()),
  );

const putupdateCategory = (): Router =>
  router.put(
    '/:id',
    authenticate,
    validate(updateCategoryValidation, { context: true }),
    handleError(updateCategory()),
  );

const deleteCcategory = (): Router =>
  router.delete(
    '/:id',
    authenticate,
    validate(deleteCategoryValidation),
    handleError(removeCategory()),
  );

export default (): Router =>
  router.use([getAllCategories(), postCreateCategory(), putupdateCategory(), deleteCcategory()]);
