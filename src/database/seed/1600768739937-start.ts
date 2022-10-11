import { MigrationInterface, QueryRunner } from 'typeorm';

import USERS from './table/users';

export class start1600768739937 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await USERS.up(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await USERS.down(queryRunner);
  }
}
