import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  BaseEntity,
  OneToOne,
  JoinColumn,
} from 'typeorm';

import { Users } from './Users';

@Entity('user_order_statistics', { schema: 'public' })
export class UserOrderStatistics extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column('integer', { nullable: true, default: () => '0' })
  noOfOrderDelivered!: number;

  @Column('integer', { nullable: true, default: () => '0' })
  noOfOrderCancel!: number;

  @Column('integer', { nullable: true, default: () => '0' })
  noOfOrderOngoing!: number;

  @Column('integer', { nullable: true, default: () => '0' })
  noOfOrderPassed!: number;

  @Column('integer', { nullable: true, default: () => '0' })
  noOfOrders!: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date | null;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date | null;

  @Column('varchar', { nullable: true })
  createdBy!: string | null;

  @Column('varchar', { nullable: true })
  updatedBy!: string | null;

  @DeleteDateColumn({ type: 'timestamp' })
  deletedAt!: Date | null;

  @OneToOne(() => Users, (user) => user.orderStatistics)
  @JoinColumn()
  user!: Users;
}
