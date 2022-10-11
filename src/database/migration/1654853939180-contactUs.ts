import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class contactUs1654853344065 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'contact_us',
      new TableColumn({
        name: 'createdAt',
        type: 'timestamp',
        isNullable: true,
      }),
    );
    await queryRunner.addColumn(
      'contact_us',
      new TableColumn({
        name: 'updatedAt',
        type: 'timestamp',
        isNullable: true,
      }),
    );
    await queryRunner.addColumn(
      'contact_us',
      new TableColumn({
        name: 'deletedAt',
        type: 'timestamp',
        isNullable: true,
      }),
    );
    queryRunner.addColumn(
      'contact_us',
      new TableColumn({
        name: 'createdBy',
        type: 'varchar',
        isNullable: true,
      }),
    );
    await queryRunner.addColumn(
      'contact_us',
      new TableColumn({
        name: 'updatedBy',
        type: 'varchar',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('contact_us', 'createdAt');
    await queryRunner.dropColumn('contact_us', 'updatedAt');
    await queryRunner.dropColumn('contact_us', 'deletedAt');
    await queryRunner.dropColumn('contact_us', 'createdBy');
    await queryRunner.dropColumn('contact_us', 'updatedBy');
  }
}
