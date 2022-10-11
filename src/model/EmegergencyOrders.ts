import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  BaseEntity,
  JoinColumn,
  ManyToOne,
} from 'typeorm';

import { OrderDetails } from './OrderDetails';

@Entity('emegergency_orders', { schema: 'public' })
export class EmegergencyOrders extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column('varchar')
  startTime!: string;

  @Column('varchar')
  endTime!: string;

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

  @ManyToOne(() => OrderDetails, (ODetails) => ODetails.emegergencyOrder)
  @JoinColumn()
  order!: OrderDetails;
}
