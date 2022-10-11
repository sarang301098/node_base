import { Router } from 'express';
import { validate } from 'express-validation';

import { authenticate, singleFileS3, handleError } from '../middleware';
import {
  changePassword,
  changePasswordValidation,
  getUsersByUserTypeValidation,
  getAllByUserType,
  createUser,
  createUserValidation,
  avatar,
  forgetPassword,
  forgetPasswordValidation,
  getAll,
  getById,
  getUsersValidation,
  getUserValidation,
  profile,
  updatePassword,
  updatePasswordValidation,
  updateProfile,
  updateUserValidation,
  resetPassword,
  resetPasswordValidation,
} from '../controller/users';
import { Media } from '../constants';

const router = Router();

const getUsers = (): Router =>
  router.get(
    '/',
    authenticate,
    validate(getUsersValidation, { context: true }),
    handleError(getAll()),
  );

const getUsersByUserType = (): Router =>
  router.get(
    '/type/all',
    authenticate,
    validate(getUsersByUserTypeValidation, { context: true }),
    handleError(getAllByUserType()),
  );

const postCreateUser = (): Router =>
  router.post('/', validate(createUserValidation), handleError(createUser()));

const patchAvatar = (): Router =>
  router.patch('/avatar', authenticate, singleFileS3(Media.USER, 'image'), handleError(avatar()));

const patchChangePassword = (): Router =>
  router.patch(
    '/change-password',
    authenticate,
    validate(changePasswordValidation),
    handleError(changePassword()),
  );

const postForgetPassword = (): Router =>
  router.post(
    '/forget-password',
    validate(forgetPasswordValidation, { context: true }),
    handleError(forgetPassword()),
  );

const postUpdatePassword = (): Router =>
  router.post(
    '/update-password',
    validate(updatePasswordValidation, { context: true }),
    handleError(updatePassword()),
  );

const getProfile = (): Router => router.get('/profile/me', authenticate, handleError(profile()));

const getUser = (): Router =>
  router.get(
    '/:id',
    authenticate,
    validate(getUserValidation, { context: true }),
    handleError(getById()),
  );

const putUpdateProfile = (): Router =>
  router.put(
    '/:id',
    authenticate,
    validate(updateUserValidation, { context: true }),
    handleError(updateProfile()),
  );

const patchResetPassword = (): Router =>
  router.patch(
    '/:id/reset-password',
    authenticate,
    validate(resetPasswordValidation),
    handleError(resetPassword()),
  );

export default (): Router =>
  router.use([
    getUser(),
    getUsers(),
    getProfile(),
    patchAvatar(),
    postCreateUser(),
    putUpdateProfile(),
    postForgetPassword(),
    getUsersByUserType(),
    patchResetPassword(),
    postUpdatePassword(),
    patchChangePassword(),
  ]);
