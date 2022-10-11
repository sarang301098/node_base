import { Router } from 'express';
import { PropaneUserType } from '../constants';
import { createAcoount, getAuthLink } from '../controller/stripe';
import { authenticate, checkUserType, handleError } from '../middleware';

const router = Router();

const stripeAuthLink = (): Router =>
  router.get(
    '/authLink',

    authenticate,

    checkUserType(PropaneUserType.VENDOR),

    handleError(getAuthLink()),
  );

const createAcc = (): Router => router.get('/account', handleError(createAcoount()));

export default (): Router => router.use([stripeAuthLink(), createAcc()]);
