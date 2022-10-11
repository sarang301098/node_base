import { In, QueryRunner } from 'typeorm';

import { MembershipPlans } from '../../../model/MembershipPlans';
import { MembershipPlanPrices } from '../../../model/MembershipPlanPrices';

const MPlanPrices = [
  {
    period: 1,
    price: 5,
  },
  {
    period: 2,
    price: 5,
  },
];

const getPlans = async (queryRunner: QueryRunner) => {
  const membershipPlanRepo = queryRunner.manager.getRepository(MembershipPlans);
  const [plans, count] = await membershipPlanRepo.findAndCount();
  return { plans, count };
};

const up = async (queryRunner: QueryRunner): Promise<void> => {
  const membershipPlanPricesRepo = queryRunner.manager.getRepository(MembershipPlanPrices);
  const { plans, count } = await getPlans(queryRunner);

  const planPrices = [];
  for (let i = 0; i < count; i++) {
    for (let j = 0; j < MPlanPrices.length; j++) {
      planPrices.push(
        membershipPlanPricesRepo.create({
          ...MPlanPrices[j],
          membershipPlan: plans[i],
        }),
      );
    }
  }
  await membershipPlanPricesRepo.save([...planPrices]);
};

const down = async (queryRunner: QueryRunner): Promise<void> => {
  const membershipPlanPricesRepo = queryRunner.manager.getRepository(MembershipPlanPrices);
  const { count: membershipPlansCount } = await getPlans(queryRunner);
  const len = membershipPlansCount * MPlanPrices.length;
  await membershipPlanPricesRepo.delete({ id: In(new Array(len).map((_, index) => index + 1)) });
};

export default { up, down };
