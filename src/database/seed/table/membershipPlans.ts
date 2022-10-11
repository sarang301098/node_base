import { In, QueryRunner } from 'typeorm';

import { MembershipPlans } from '../../../model/MembershipPlans';

const plans = [
  {
    id: 1,
    name: 'Home Lite',
    type: 1,
    productIds: [] as any,
    categoryIds: [] as any,
  },
  {
    id: 2,
    name: 'Home Pro',
    type: 1,
    productIds: [],
    categoryIds: [],
  },
  {
    id: 3,
    name: 'Grilling Lite',
    type: 2,
    productIds: [],
    categoryIds: [],
  },
  {
    id: 4,
    name: 'Grilling Pro',
    type: 2,
    productIds: [],
    categoryIds: [],
  },
  {
    id: 5,
    name: 'Business Lite',
    type: 2,
    productIds: [],
    categoryIds: [],
  },
  {
    id: 6,
    name: 'Business Pro',
    type: 2,
    productIds: [],
    categoryIds: [],
  },
];

const up = async (queryRunner: QueryRunner): Promise<void> => {
  const membershipPlansRepo = queryRunner.manager.getRepository(MembershipPlans);
  await membershipPlansRepo.save([...plans]);
};

const down = async (queryRunner: QueryRunner): Promise<void> => {
  const membershipPlansRepo = queryRunner.manager.getRepository(MembershipPlans);
  await membershipPlansRepo.delete({ id: In(plans.map((plan) => plan.id)) });
};

export default { up, down };
