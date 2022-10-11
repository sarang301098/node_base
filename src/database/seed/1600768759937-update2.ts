import { MigrationInterface, QueryRunner } from 'typeorm';

import MEMBERSHIPPLANS from './table/membershipPlans';
import MEMBERSHIPPLANPRICES from './table/membershipPlansPrices';
import MEMBERSHIPPLANDETAILS from './table/membershipPlansDetails';

export class updateTwo1600768759937 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await MEMBERSHIPPLANS.up(queryRunner);
    await MEMBERSHIPPLANPRICES.up(queryRunner);
    await MEMBERSHIPPLANDETAILS.up(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await MEMBERSHIPPLANDETAILS.down(queryRunner);
    await MEMBERSHIPPLANPRICES.down(queryRunner);
    await MEMBERSHIPPLANS.down(queryRunner);
  }
}
