import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class driverDetails1657272651098 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'driver_details',
      new TableColumn({
        name: 'address',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'driver_details',
      new TableColumn({
        name: 'licence_image',
        type: 'varchar',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('driver_details', 'address');
    await queryRunner.dropColumn('driver_details', 'licence_image');
  }
}
