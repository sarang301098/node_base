import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  BaseEntity,
  ManyToOne,
  JoinColumn,
  Index,
  RelationId,
} from 'typeorm';

import { Users } from './Users';
import { OrderDetails } from './OrderDetails';

@Entity('freelance_drivers_payment', { schema: 'public' })
export class FreelanceDriversPayment extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column('double', { nullable: true, default: () => '0' })
  paidAmount!: number | null;

  @Column('timestamp', { nullable: true })
  scheduleDate!: Date;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  @Column('varchar', { nullable: true })
  createdBy!: string | null;

  @Column('varchar', { nullable: true })
  updatedBy!: string | null;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt!: Date;

  @ManyToOne(() => Users, (user) => user.freelanceDriversPayment)
  @JoinColumn()
  driver!: Users;

  @Index()
  @ManyToOne(() => OrderDetails, (ODetails) => ODetails.freelanceDriverPayment)
  order!: OrderDetails;

  @RelationId((payment: FreelanceDriversPayment) => payment.order)
  orderId!: number;
}
