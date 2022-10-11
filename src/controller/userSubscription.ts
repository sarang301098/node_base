import { getManager, getRepository } from 'typeorm';
import moment from 'moment';

import { UserSubscription } from '../model/UserSubscription';

export const updateStatusSubscription = async (): Promise<void> => {
  // Get Current subscriptions.
  const query = getManager()
    .createQueryBuilder(UserSubscription, 'subscription')
    .andWhere('subscription.endDate <= :date', { date: moment().toDate() });

  const expireSubscriptions = await query.getMany();
  const userSubscriptionRepo = getRepository(UserSubscription);

  if (expireSubscriptions && expireSubscriptions.length) {
    for (let index = 0; index < expireSubscriptions.length; index++) {
      if (expireSubscriptions[index]?.isActive) {
        expireSubscriptions[index] = Object.assign({}, expireSubscriptions[index], {
          isActive: false,
        });
      }
    }
  }

  userSubscriptionRepo.save(expireSubscriptions);
};
