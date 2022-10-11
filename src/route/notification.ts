import { Router } from 'express';
import { authenticate, handleError, checkUserType } from '../middleware';
import {
  getAllValidation,
  getAll,
  removeNotificationValidation,
  removeNotification,
  sendNotification,
  sendNotificationValidation,
  clearAllNotification,
  readNotification,
  readNotificationValidation,
  notificationsSentUsersOptionsValidation,
  notificationsSentUsersOptions,
} from '../controller/notification';
import { validate } from 'express-validation';
import { PropaneUserType } from '../constants';

const router = Router();

const getAllNotification = () =>
  router.get(
    '/',
    authenticate,
    validate(getAllValidation, { context: true }),
    handleError(getAll()),
  );

const postSendNotification = (): Router =>
  router.post(
    '/',
    authenticate,
    validate(sendNotificationValidation, { context: true }),
    handleError(sendNotification()),
  );

const deleteNotification = (): Router =>
  router.post(
    '/delete',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(removeNotificationValidation, { context: true }),
    handleError(removeNotification()),
  );

const clearNotification = (): Router =>
  router.delete('/clear', authenticate, handleError(clearAllNotification()));

const postReadNotification = (): Router =>
  router.patch(
    '/read',
    authenticate,
    validate(readNotificationValidation, { context: true }),
    handleError(readNotification()),
  );

const getNotificationsSentUsersOptions = (): Router =>
  router.patch(
    '/all/tousers',
    authenticate,
    validate(notificationsSentUsersOptionsValidation, { context: true }),
    handleError(notificationsSentUsersOptions()),
  );

export default (): Router =>
  router.use([
    clearNotification(),
    getAllNotification(),
    deleteNotification(),
    postReadNotification(),
    postSendNotification(),
    getNotificationsSentUsersOptions(),
  ]);
