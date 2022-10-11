import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  ManyToOne,
  Index,
  RelationId,
  DeleteDateColumn,
} from 'typeorm';

import { VendorDetails } from './VendorDetails';
import { TimeSlots } from './TimeSlots';

@Entity('vendor_schedule', { schema: 'public' })
export class VendorSchedule extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column('integer', { nullable: true, default: () => '1' }) // 0 = notApproved, 1 = approved, 2 = pending
  status!: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date | null;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date | null;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt!: Date;

  @Column('integer', { nullable: true })
  maxAcceptOrderLimit!: number;

  @Column('integer', { nullable: true }) // 1-Monday, 2-Tuesday, ...
  day!: number;

  @Column('boolean', { default: () => 'true' })
  isChecked!: boolean;

  @Index()
  @ManyToOne(() => TimeSlots, (timeslot) => timeslot.vendorSchedules)
  timeSlot!: TimeSlots | null;

  @RelationId((VSchedule: VendorSchedule) => VSchedule.timeSlot)
  timeslotId!: number | null;

  @Index()
  @ManyToOne(() => VendorDetails, (vendor) => vendor.vendorSchecules)
  vendor!: VendorDetails | null;

  @RelationId((VSchedule: VendorSchedule) => VSchedule.vendor)
  vendorId!: number | null;
}
