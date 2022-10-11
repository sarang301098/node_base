import { Router } from 'express';
import { validate } from 'express-validation';
import { PropaneUserType } from '../../constants';
import { authenticate, checkUserType, handleError } from '../../middleware';
import {
  adminContactUs,
  adminContactUsValidation,
  contactUsList,
  contactUsListValidation,
  removeContactUs,
  removeContactUsValidation,
  userContactUs,
  userContactUsValidation,
} from '../../controller/v2/contactUs';

const router = Router();

const postUserContactUs = (): Router =>
  router.post(
    '/',
    authenticate,
    validate(userContactUsValidation, { context: true }),
    handleError(userContactUs()),
  );

const getContactUsList = (): Router =>
  router.get(
    '/',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(contactUsListValidation, { context: true }),
    handleError(contactUsList()),
  );

const deleteContactUs = (): Router =>
  router.delete(
    '/:id',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(removeContactUsValidation, { context: true }),
    handleError(removeContactUs()),
  );

const postAdminContactUs = (): Router =>
  router.patch(
    '/admin/:id',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(adminContactUsValidation, { context: true }),
    handleError(adminContactUs()),
  );

export default (): Router =>
  router.use([postUserContactUs(), getContactUsList(), deleteContactUs(), postAdminContactUs()]);
