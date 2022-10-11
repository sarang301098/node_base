import { MigrationInterface, QueryRunner } from 'typeorm';

import DELIVERYLOCATION from './table/deliveryLocations';
import CANCELLATIONREASONS from './table/cancellationReason';

export class updateThree1600768769937 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await DELIVERYLOCATION.up(queryRunner);
    await CANCELLATIONREASONS.up(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await DELIVERYLOCATION.down(queryRunner);
    await CANCELLATIONREASONS.down(queryRunner);
  }
}
