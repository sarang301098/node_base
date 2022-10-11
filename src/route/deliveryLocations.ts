import { Router } from 'express';
import { validate } from 'express-validation';

import { handleError, authenticate } from '../middleware';
import {
  getDeliveryLocationsValidation,
  getAll,
  createDeliveryLocationValidation,
  createDeliveryLocation,
  updateDeliveryLocationValidation,
  updateDeliveryLocation,
  deleteDeliveryLocationValidation,
  removeDeliveryLocation,
  restoreDeliveryLocationValidation,
  restoreDeliveryLocation,
} from '../controller/deliveryLocations';

const router = Router();

const getAllDeliveryLocations = (): Router =>
  router.get(
    '/',
    authenticate,
    validate(getDeliveryLocationsValidation, { context: true }),
    handleError(getAll()),
  );

const postCreateDeliveryLocations = (): Router =>
  router.post(
    '/',
    authenticate,
    validate(createDeliveryLocationValidation, { context: true }),
    handleError(createDeliveryLocation()),
  );

const putUpdateDeliveryLocations = (): Router =>
  router.put(
    '/:id',
    authenticate,
    validate(updateDeliveryLocationValidation, { context: true }),
    handleError(updateDeliveryLocation()),
  );

const deleteDeliveryLocations = (): Router =>
  router.delete(
    '/:id',
    authenticate,
    validate(deleteDeliveryLocationValidation),
    handleError(removeDeliveryLocation()),
  );

const restoreDeliveryLocations = (): Router =>
  router.patch(
    '/:id',
    authenticate,
    validate(restoreDeliveryLocationValidation, { context: true }),
    handleError(restoreDeliveryLocation()),
  );

export default (): Router =>
  router.use([
    getAllDeliveryLocations(),
    postCreateDeliveryLocations(),
    putUpdateDeliveryLocations(),
    deleteDeliveryLocations(),
    restoreDeliveryLocations(),
  ]);
