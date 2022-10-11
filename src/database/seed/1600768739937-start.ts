import { MigrationInterface, QueryRunner } from 'typeorm';

import USERS from './table/users';
import MODULES from './table/modules';
import EMAILTEMPLATES from './table/emailTemplates';

export class start1600768739937 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await USERS.up(queryRunner);
    await EMAILTEMPLATES.up(queryRunner);
    await MODULES.up(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await USERS.down(queryRunner);
    await EMAILTEMPLATES.down(queryRunner);
    await MODULES.down(queryRunner);
  }
}
