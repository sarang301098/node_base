import { Router } from 'express';
import { validate } from 'express-validation';

import { handleError, authenticate } from '../middleware';
import {
  createAppSettingsValidation,
  createAppSettings,
  getAll,
  updateAppSettingValidation,
  updateAppSettings,
  updateAppSettingManyValidation,
  updateAppSettingsMany,
  deleteAppSettingManyValidation,
  deleteAppSettingsMany,
} from '../controller/appSettings';

const router = Router();

const getAllAppSettings = (): Router => router.get('/', authenticate, handleError(getAll()));

const postCreateAppSettings = (): Router =>
  router.post(
    '/',
    authenticate,
    validate(createAppSettingsValidation, { context: true }),
    handleError(createAppSettings()),
  );

const putUpdateAppSettings = (): Router =>
  router.put(
    '/:id',
    authenticate,
    validate(updateAppSettingValidation, { context: true }),
    handleError(updateAppSettings()),
  );

const putUpdateAppSettingsMany = (): Router =>
  router.patch(
    '/many',
    authenticate,
    validate(updateAppSettingManyValidation, { context: true }),
    handleError(updateAppSettingsMany()),
  );

const removeAppSettingsMany = (): Router =>
  router.delete(
    '/many',
    authenticate,
    validate(deleteAppSettingManyValidation, { context: true }),
    handleError(deleteAppSettingsMany()),
  );

export default (): Router =>
  router.use([
    getAllAppSettings(),
    postCreateAppSettings(),
    putUpdateAppSettings(),
    putUpdateAppSettingsMany(),
    removeAppSettingsMany(),
  ]);
