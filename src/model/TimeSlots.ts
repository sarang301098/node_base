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

import { Cart } from './Cart';
import { Orders } from './Orders';
import { VendorSchedule } from './VendorSchedule';

@Entity('time_slots', { schema: 'public' })
export class TimeSlots extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: string;

  @Column('time')
  startTime!: Date;

  @Column('time')
  endTime!: Date;

  @Column('integer', { nullable: true, default: () => '1' }) // 0 = notApproved, 1 = approved, 2 = pending
  status!: number | null;

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

  @OneToMany(() => VendorSchedule, (vendorSchedule) => vendorSchedule.timeSlot)
  vendorSchedules?: VendorSchedule[] | null;

  @OneToMany(() => Cart, (cart) => cart.timeslot)
  cart!: Cart[] | null;

  @OneToMany(() => Orders, (order) => order.timeSlot)
  orders!: Orders[] | null;
}
