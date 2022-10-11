import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  BaseEntity,
  ManyToOne,
  Index,
  RelationId,
} from 'typeorm';

import { Users } from './Users';
import { OrderDetails } from './OrderDetails';

import { OrderStatus } from '../constants';

@Entity('order_status_log', { schema: 'public' })
export class OrderStatusLogs extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'enum', enum: OrderStatus })
  status!: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date | null;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date | null;

  @Column('varchar', { nullable: true })
  createdBy!: string | null;

  @Column('varchar', { nullable: true })
  updatedBy!: string | null;

  @DeleteDateColumn({ type: 'timestamp' })
  deletedAt!: Date;

  @Index()
  @ManyToOne(() => Users, (users) => users.orderLogs)
  user!: Users;

  @RelationId((orderStatusLog: OrderStatusLogs) => orderStatusLog.user)
  userId!: string;

  @Index()
  @ManyToOne(() => OrderDetails, (ODetails) => ODetails.orderLogs)
  order?: OrderDetails;

  @RelationId((orderStatusLog: OrderStatusLogs) => orderStatusLog.order)
  orderId?: number;
}
