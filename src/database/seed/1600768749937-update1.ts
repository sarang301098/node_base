import { MigrationInterface, QueryRunner } from 'typeorm';

import CATEGORIES from './table/categories';
import APPSETTINGS from './table/appSettings';
import CMSPAGES from './table/cmsPages';

export class updateOne1600768749937 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await CATEGORIES.up(queryRunner);
    await APPSETTINGS.up(queryRunner);
    await CMSPAGES.up(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await CATEGORIES.down(queryRunner);
    await APPSETTINGS.down(queryRunner);
    await CMSPAGES.down(queryRunner);
  }
}
