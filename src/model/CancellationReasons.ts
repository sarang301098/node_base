import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  BaseEntity,
  OneToMany,
} from 'typeorm';

import { OrderDetails } from './OrderDetails';

import { PropaneUserType } from '../constants';

@Entity('cancellation_reasons', { schema: 'public' })
export class CancellationReasons extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column('varchar', { length: 255 })
  reason!: string;

  @Column({ type: 'enum', enum: PropaneUserType })
  userType!: string;

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

  @OneToMany(() => OrderDetails, (orderDetail) => orderDetail.cancellationReason)
  orders!: OrderDetails[];
}
