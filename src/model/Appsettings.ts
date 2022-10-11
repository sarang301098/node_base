import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  BaseEntity,
} from 'typeorm';

@Entity('app_settings', { schema: 'public' })
export class Appsettings extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column('integer', { nullable: true }) // 0 - N/A, 1 - fuel Delivery, 2 - Tank exchange
  orderType!: number;

  @Column('varchar', { nullable: true }) // customer / driver
  key!: string;

  @Column('varchar', { nullable: true })
  label!: string;

  @Column('double', { nullable: true })
  value!: number;

  @Column('integer', { nullable: true }) // 1 - order, 2 - general
  type!: number;

  @Column('boolean', { default: () => 'false' })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date | null;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date | null;

  @DeleteDateColumn({ type: 'timestamp' })
  deletedAt!: Date | null;

  @Column('varchar', { nullable: true })
  createdBy!: string | null;

  @Column('varchar', { nullable: true })
  updatedBy!: string | null;
}
