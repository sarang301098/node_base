import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UserAddColumn1655447684383 implements MigrationInterface {
  private stripeAccountIdColumn = new TableColumn({
    name: 'stripe_account_id',
    type: 'varchar',
    isNullable: true,
    default: null,
  });

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn('users', this.stripeAccountIdColumn);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', this.stripeAccountIdColumn);
  }
}
