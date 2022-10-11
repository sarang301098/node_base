import { In, QueryRunner } from 'typeorm';

import { MembershipPlanPrices } from '../../../model/MembershipPlanPrices';
import { MembershipPlanDetails } from '../../../model/MembershipPlanDetails';

const planPriceDetailsOne = [
  {
    label: 'Includes monitoring equipment, Monitoring of propane levels, Automatic level alerts',
    key: 1,
  },
  {
    label: '{{VALUE}} off all propane gallons delivered',
    value: 10,
    key: 2,
    isPercentage: true,
  },
];

const planPriceDetailsTwo = [
  {
    label: '{{VALUE}} off all propane tank exchanges (option to have % off instead of flat rate)',
    value: 4,
    key: 1,
    isDollar: true,
  },
  {
    label: 'for those that are buying more than {{VALUE}} exchange per month.',
    value: 10,
    key: 2,
  },
  {
    label: 'Limit of {{VALUE}} tanks per month, or charges non membership rates',
    value: 10,
    key: 3,
  },
  {
    label: 'Up to {{VALUE}} in savings per month',
    value: 10,
    key: 4,
    isDollar: true,
  },
];

const getPlanPricesLength = async (queryRunner: QueryRunner) => {
  const membershipPlanPricesRepo = queryRunner.manager.getRepository(MembershipPlanPrices);
  const [prices, count] = await membershipPlanPricesRepo.findAndCount();
  const priceIds = (prices || []).map((price) => price.id);
  return { priceIds, count };
};

const up = async (queryRunner: QueryRunner): Promise<void> => {
  const membershipPlanPricesRepo = queryRunner.manager.getRepository(MembershipPlanPrices);
  const membershipPlanDetailsRepo = queryRunner.manager.getRepository(MembershipPlanDetails);
  const { priceIds, count: pricesLen } = await getPlanPricesLength(queryRunner);

  const planPriceDetails = [];
  for (let i = 0; i < pricesLen; i++) {
    const membershipPlanPrices = await membershipPlanPricesRepo.findOne({
      where: { id: priceIds[i] },
      relations: ['membershipPlan'],
    });

    if (membershipPlanPrices?.membershipPlan?.type === 1) {
      for (let j = 0; j < planPriceDetailsOne.length; j++) {
        planPriceDetails.push(
          membershipPlanDetailsRepo.create({
            ...planPriceDetailsOne[j],
            membershipPlanPrices,
          }),
        );
      }
    } else if (membershipPlanPrices?.membershipPlan?.type === 2) {
      for (let k = 0; k < planPriceDetailsTwo.length; k++) {
        planPriceDetails.push(
          membershipPlanDetailsRepo.create({
            ...planPriceDetailsTwo[k],
            membershipPlanPrices,
          }),
        );
      }
    }
  }
  await membershipPlanDetailsRepo.save([...planPriceDetails]);
};

const down = async (queryRunner: QueryRunner): Promise<void> => {
  const membershipPlanDetailsRepo = queryRunner.manager.getRepository(MembershipPlanDetails);
  const { count: pricesLen } = await getPlanPricesLength(queryRunner);
  const len = (pricesLen / 2) * (planPriceDetailsOne.length + planPriceDetailsTwo.length);
  await membershipPlanDetailsRepo.delete({ id: In(new Array(len).map((_, index) => index + 1)) });
};

export default { up, down };
