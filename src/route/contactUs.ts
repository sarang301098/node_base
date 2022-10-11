import { Router } from 'express';
import { validate } from 'express-validation';
import { contactUs, contactUsValidation } from '../controller/contactUs';
import { authenticate, handleError } from '../middleware';
const router = Router();

const postContactUs = (): Router =>
  router.post(
    '/',
    authenticate,
    validate(contactUsValidation, { context: true }),
    handleError(contactUs()),
  );

export default (): Router => router.use([postContactUs()]);
