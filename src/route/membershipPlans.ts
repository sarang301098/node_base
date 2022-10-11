import { Router } from 'express';
import { validate } from 'express-validation';

import { handleError, authenticate, checkUserType } from '../middleware';
import {
  getMembershipPlansValidation,
  getAll,
  getByIdMembershipPlanValidation,
  getByIdMembershipPlan,
  purchaseMembershipPlanValidation,
  purchaseMembershipPlan,
  updateMembershipPlansValidation,
  updateMembershipPlans,
  userSubscription,
  getAllAppPlans,
} from '../controller/membershipPlans';
import { PropaneUserType } from '../constants';

const router = Router();

const getAllPlans = (): Router =>
  router.get(
    '/',
    authenticate,
    validate(getMembershipPlansValidation, { context: true }),
    handleError(getAll()),
  );

const getByIdPlan = (): Router =>
  router.get(
    '/:id',
    authenticate,
    validate(getByIdMembershipPlanValidation, { context: true }),
    handleError(getByIdMembershipPlan()),
  );

const postPurchasePlan = (): Router =>
  router.post(
    '/purchase',
    authenticate,
    checkUserType(PropaneUserType.USER, PropaneUserType.DRIVER, PropaneUserType.VENDOR),
    validate(purchaseMembershipPlanValidation, { context: true }),
    handleError(purchaseMembershipPlan()),
  );

const patchMembershipPlan = (): Router =>
  router.patch(
    '/',
    authenticate,
    checkUserType(PropaneUserType.ADMIN, PropaneUserType.SUB_ADMIN),
    validate(updateMembershipPlansValidation, { context: true }),
    handleError(updateMembershipPlans()),
  );

const getActivSubscription = (): Router =>
  router.get('/users/subscription', authenticate, handleError(userSubscription()));

const getAllApp = (): Router => router.get('/all/app', authenticate, handleError(getAllAppPlans()));

export default (): Router =>
  router.use([
    getAllApp(),
    getAllPlans(),
    getByIdPlan(),
    postPurchasePlan(),
    patchMembershipPlan(),
    getActivSubscription(),
  ]);
