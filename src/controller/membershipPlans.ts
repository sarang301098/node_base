import { getManager, getRepository, Not, IsNull, LessThan, getCustomRepository } from 'typeorm';
import { Request, Response } from 'express';
import { Joi } from 'express-validation';
import * as schedule from 'node-schedule';
import moment from 'moment';
import { map, get } from 'lodash';

import { MailService } from '../service/Mail';
import PurchasePlanService from '../service/PurchasePlan';
import SendPushNotificationService from '../service/notification';

import { BadRequestError, NotFoundError } from '../error';

import { Users } from '../model/Users';
import { MembershipPlans } from '../model/MembershipPlans';
import { UserSubscription } from '../model/UserSubscription';
import { MembershipPlanPrices } from '../model/MembershipPlanPrices';
import { MembershipPlanDetails } from '../model/MembershipPlanDetails';

import { UsersRepository } from '../repository/Users';
import { NotificationsRepository } from '../repository/Notifications';

import { PaymentGateways } from '../constants';

export const getMembershipPlansValidation = {
  query: Joi.object({
    search: Joi.string().max(50).default(null),
    type: Joi.number().default(0),
    status: Joi.boolean().optional().default(null),
    isFilters: Joi.boolean().optional().default(true),
  }),
};
export const getAll = () => async (req: Request, res: Response): Promise<void> => {
  const {
    query: { search, type, status, isFilters },
  } = req;
  const membershipPlansRepository = getRepository(MembershipPlans);

  const query = getManager()
    .createQueryBuilder(MembershipPlans, 'membershipPlan')
    .leftJoinAndSelect('membershipPlan.prices', 'prices')
    .leftJoinAndSelect('prices.details', 'details');

  if (status !== null) {
    query.where('membershipPlan.isActive = :status', { status });
  }
  if (search && search !== '') {
    query.andWhere('membershipPlan.name like :name', { name: '%' + search + '%' });
  }
  if (type) {
    query.andWhere('membershipPlan.type = :type', { type });
  }

  const [plans, count] = isFilters
    ? await query.getManyAndCount()
    : await membershipPlansRepository.findAndCount({ relations: ['prices', 'prices.details'] });

  res.status(200).json({ plans, count });
};

export const getByIdMembershipPlanValidation = {
  params: Joi.object({ id: Joi.number().integer().required() }),
};
export const getByIdMembershipPlan = () => async (req: Request, res: Response): Promise<void> => {
  const {
    params: { id },
  } = req;

  const membershipPlansRepository = getRepository(MembershipPlans);

  const membershipPlan = await membershipPlansRepository.findOne({
    where: { id },
    relations: ['prices', 'prices.details'],
  });

  res.status(200).json({ membershipPlan });
};

export const updateMembershipPlansValidation = {
  body: Joi.object({
    membershipPlan: Joi.object({
      id: Joi.number().integer().min(0).required(),
      name: Joi.string().min(0).required(),
      productIds: Joi.array().items(Joi.number().integer().min(0).required()).allow(null),
      categoryIds: Joi.array()
        .items(
          Joi.alternatives(
            Joi.number().integer().min(0).required(),
            Joi.string().min(1).required(),
          ),
        )
        .allow(null),
      isActive: Joi.boolean().required(),
    }).allow(null),
    prices: Joi.array()
      .items(
        Joi.object({
          id: Joi.number().integer().min(0).required(),
          price: Joi.number().min(0).required(),
          isActive: Joi.boolean().required(),
        }),
      )
      .allow(null),
    details: Joi.array()
      .items(
        Joi.object({
          id: Joi.number().integer().min(0).required(),
          value: Joi.number().min(0).required(),
        }),
      )
      .allow(null),
  }),
};
export const updateMembershipPlans = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { id: userId },
    body: { membershipPlan, prices, details },
  } = req;

  const membershipPlansRepo = getRepository(MembershipPlans);
  const membershipPlanPricesRepo = getRepository(MembershipPlanPrices);
  const membershipPlanDetailsRepo = getRepository(MembershipPlanDetails);

  if (membershipPlan) {
    const planById = await membershipPlansRepo.findOneOrFail(membershipPlan?.id);

    if (membershipPlan.name) planById.name = membershipPlan.name;
    if (membershipPlan.productIds) planById.productIds = membershipPlan.productIds;
    if (membershipPlan.categoryIds) planById.categoryIds = membershipPlan.categoryIds;
    planById.isActive = membershipPlan.isActive;
    planById.updatedBy = userId;

    await membershipPlansRepo.save(planById);
  }

  if (prices && prices.length) await membershipPlanPricesRepo.save(prices);

  if (details && details.length) await membershipPlanDetailsRepo.save(details);

  res.sendStatus(204);
};

export const deletePlanValidation = {
  params: Joi.object({ id: Joi.number().integer().min(1).required() }),
};
export const removePlans = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { id: userId },
    params: { id },
  } = req;

  const membershipPlan = getRepository(MembershipPlans);

  await membershipPlan.findOneOrFail({
    where: { id },
  });

  await getManager().transaction(async (em) => {
    await em.update(MembershipPlans, { id }, { updatedBy: userId });
    await em.softDelete(MembershipPlans, id);
    await em.update(MembershipPlanPrices, { id }, { updatedBy: userId });
    await em.softDelete(MembershipPlanPrices, { membershipPlan: id });
    await em.update(MembershipPlanDetails, { id }, { updatedBy: userId });
    await em.softDelete(MembershipPlanDetails, { membershipPlanPrices: id });
  });
  res.send(204);
};

export const purchaseMembershipPlanValidation = {
  body: Joi.object({
    stripeCardId: Joi.string().required(),
    stripeCustomerId: Joi.string().required(),
    membershipPlanId: Joi.number().integer().min(0).required(),
    membershipPlanPricesId: Joi.number().integer().min(0).required(),
  }),
};
export const purchaseMembershipPlan = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    body: { stripeCustomerId, stripeCardId, membershipPlanId, membershipPlanPricesId },
  } = req;

  const userSubscriptionRepo = getRepository(UserSubscription);
  const membershipPlanRepository = getRepository(MembershipPlans);
  const membershipPlanPricesRepository = getRepository(MembershipPlanPrices);
  const mailService = new MailService();

  // check for the price availability.
  const membershipPlanPrice = await membershipPlanPricesRepository.findOne(membershipPlanPricesId);
  if (!membershipPlanPrice)
    throw new NotFoundError('Membership plan not found', 'MEMBERSHIPPLAN_NOT_FOUND');

  // check for the membershipplan availability.
  const membershipPlan = await membershipPlanRepository.findOne(membershipPlanId);
  if (!membershipPlan)
    throw new NotFoundError('Membership plan not found', 'MEMBERSHIPPLAN_NOT_FOUND');

  const startDate = moment().startOf('day').toDate();
  const endDate = moment()
    .add(membershipPlanPrice?.period === 1 ? 1 : 12, 'months')
    .toDate();

  const existingSubscription = await userSubscriptionRepo.findOne({
    user,
    isActive: true,
    membershipPlan,
    membershipPlanPrice,
    cancelledDate: Not(IsNull()),
    endDate: LessThan(startDate),
  });
  if (existingSubscription)
    throw new BadRequestError('Subscription is already active', 'SUBSCRIPTION_ALREADY_ACTIVE');

  let subscription = userSubscriptionRepo.create({
    user,
    endDate,
    startDate,
    membershipPlan,
    membershipPlanPrice,
    price: Number(membershipPlanPrice?.price),
  });
  subscription = await userSubscriptionRepo.save(subscription);

  // notification
  const notificationRepo = getCustomRepository(NotificationsRepository);
  let notification = notificationRepo.create({
    readedBy: [],
    deletedBy: [],
    isAdmin: false,
    toIds: [user?.id],
    notificationType: 1,
    title: `Membership ${membershipPlan?.name} added successfully`,
    description: `Membership ${membershipPlan?.name} added successfully`,
    adminMessage: `${user?.fullName} purchase plan ${membershipPlan?.name} in ${membershipPlanPrice?.price}`,
  });
  notification = await notificationRepo.save(notification);

  let result;
  try {
    const service = new PurchasePlanService();
    result = await service.execute({
      stripeCardId,
      confirm: true,
      currency: 'usd',
      userId: user?.id,
      membershipPlanId,
      stripeCustomerId,
      isPlanPurchase: true,
      membershipPlanPricesId,
      userSubscriptionId: subscription?.id,
      amount: Number(membershipPlanPrice?.price),
    });
  } catch (error) {
    await notificationRepo.delete(notification);
    await userSubscriptionRepo.delete(subscription);
    throw new BadRequestError('Error in stripe payment');
  }

  if (result && result?.PaymentIntent) {
    subscription = await userSubscriptionRepo.save(
      Object.assign({}, subscription, {
        platform: PaymentGateways.STRIPE,
        stripePaymentIntentId: result?.PaymentIntent?.id,
        stripeCardId: result?.PaymentIntent?.payment_method,
        isActive: true,
        status: 2,
        latestReceipt:
          result?.PaymentIntent?.charges?.data &&
          result?.PaymentIntent?.charges?.data[0].receipt_url,
      }),
    );

    // TODO: check the schedule job.
    schedule.scheduleJob(endDate, async () => {
      await getManager().transaction(async (em) => {
        await em.update(
          UserSubscription,
          { id: subscription?.id },
          { updatedBy: user?.id, isActive: false },
        );
        await em.softDelete(UserSubscription, subscription?.id);
      });
    });

    // remider of memberhsipplan with pushnotification.
    const reminderDate = moment(endDate).subtract(2, 'days').toDate();
    schedule.scheduleJob(reminderDate, async () => {
      const userRepo = getCustomRepository(UsersRepository);
      const notificationToUser = notificationRepo.create({
        readedBy: [],
        deletedBy: [],
        isAdmin: false,
        toIds: [user?.id],
        notificationType: 1,
        title: `Membership expired reminder`,
        description: `Your Membership ${membershipPlan?.name} expired soon`,
        adminMessage: `Your Membership ${membershipPlan?.name} expired soon`,
      });
      await notificationRepo.save(notificationToUser);

      const userWithToken = await userRepo.getByRelatioins(user, ['token']);
      if (userWithToken && userWithToken?.token && userWithToken?.token?.deviceId) {
        try {
          const notificationService = new SendPushNotificationService();
          await notificationService.execute({
            toIds: [user?.id],
            title: `Membership reminder`,
            description: `Your Membership ${membershipPlan?.name} expired soon`,
            notificationType: 1,
            tokens: [userWithToken?.token?.deviceId],
          });
          const mailBody = {
            to: user?.email,
            email: user?.email,
            text: 'expire_plan',
            subject: 'Expire Plan',
            fullname: user?.fullName,
            endDate: endDate.toString(),
            startDate: startDate.toString(),
            planName: membershipPlan?.name,
            planPrice: membershipPlan?.prices.toString(),
          };
          await mailService.send(mailBody);
        } catch (error) {
          throw new BadRequestError('Error while send notification', 'NOTIFICATION_SENT_ERROR');
        }
      }
    });

    const userRepo = getRepository(Users);
    await userRepo.update(user?.id, { userSubscriptionCount: user?.userSubscriptionCount + 1 });
  }

  // TODO: uncomment send mail code.
  const mailBody = {
    to: user?.email,
    email: user?.email,
    text: 'purchase_plan',
    subject: 'Purchase Plan',
    fullname: user?.fullName,
    endDate: endDate.toString(),
    startDate: startDate.toString(),
  };
  await mailService.send(mailBody);

  // filter
  subscription = Object.assign({}, subscription, { user: undefined, membershipPlan: undefined });

  res.json(subscription);
};

export const userSubscription = () => async (req: Request, res: Response): Promise<void> => {
  const { user } = req;

  const start = moment().toDate();

  const query = getManager()
    .createQueryBuilder(UserSubscription, 'subscription')
    .select([
      'subscription.id',
      'subscription.startDate',
      'subscription.endDate',
      'subscription.price',
      'subscription.platform',
      'subscription.isActive',
      'subscription.status',
    ])
    .leftJoin('subscription.membershipPlan', 'membership')
    .addSelect(['membership.name', 'membership.type'])
    .leftJoin('subscription.membershipPlanPrice', 'membershipPlanPrice')
    .addSelect(['membershipPlanPrice.period'])
    .where('subscription.user_id = :userId', { userId: user.id })
    .andWhere('subscription.isActive = :isActive', { isActive: 1 })
    .andWhere('subscription.status = :status', { status: 2 })
    .andWhere('subscription.startDate <= :start AND subscription.endDate >= :start', { start });

  const [subscription, count] = await query.getManyAndCount();

  res.status(200).json({ subscription, count });
};

export const getAllAppPlans = () => async (req: Request, res: Response): Promise<void> => {
  const query = getManager()
    .createQueryBuilder(MembershipPlans, 'membershipPlan')
    .leftJoinAndSelect('membershipPlan.prices', 'prices')
    .leftJoinAndSelect('prices.details', 'details');

  const plans = await query.getMany();

  const response = [];
  let index = 0;
  for (let i = 0; i < plans.length; i++) {
    const len = (plans[i]?.prices || []).length;
    for (let j = 0; j < len; j++) {
      response[index] = {
        id: index + 1,
        name: plans[i].name || '',
        period:
          plans[i]?.prices && plans[i]?.prices[j]
            ? (plans[i]?.prices[j] || {}).period === 1
              ? 'Month'
              : 'Year'
            : 'N/A',
        price:
          plans[i]?.prices && plans[i]?.prices[j]
            ? `${(plans[i]?.prices[j] || {}).price || 0} $`
            : 'N/A',
        orderType: plans[i].type,
        description: map(get(plans[i]?.prices[j] || {}, 'details'), (detail) =>
          convertDetails(detail?.label, detail?.value, detail?.isDollar, detail?.isPercentage),
        ),
        membershipPlanId: plans[i]?.id,
        membershipPlanPricesId:
          plans[i]?.prices && plans[i]?.prices[j] ? (plans[i]?.prices[j] || {}).id : null,
      };
      index++;
    }
  }

  res.status(200).json({ response });
};

const convertDetails = (
  label: string | null,
  value: number | null,
  isDollar: boolean,
  isPercentage: boolean,
) => {
  if (label && label.indexOf('{{VALUE}}') !== -1) {
    if (isDollar) label = label.replace('{{VALUE}}', `${value || 0} $`);
    if (isPercentage) label = label.replace('{{VALUE}}', `${value || 0} %`);
    else label = label.replace('{{VALUE}}', `${value || 0}`);
  }
  return label || '';
};
