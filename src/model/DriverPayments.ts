import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { Users } from './Users';

@Entity('driver_payments', { schema: 'public' })
export class DriverPayments extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: string;

  @Column('double', { nullable: true })
  amount!: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date | null;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date | null;

  @ManyToOne(() => Users, (user) => user.toDriversPayment)
  @JoinColumn({ name: 'to_user_id' })
  toUser!: Users;

  @ManyToOne(() => Users, (user) => user.fromDriversPayment)
  @JoinColumn({ name: 'from_user_id' })
  fromUser!: Users;
}
