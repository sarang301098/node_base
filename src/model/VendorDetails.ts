import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  OneToOne,
  OneToMany,
  JoinColumn,
  DeleteDateColumn,
} from 'typeorm';

import { Cart } from './Cart';
import { Users } from './Users';
import { OrderDetails } from './OrderDetails';
import { DriverDetails } from './DriverDetails';
import { VendorSchedule } from './VendorSchedule';
import { VendorStocks } from './VendorStocks';

@Entity('vendor_details', { schema: 'public' })
export class VendorDetails extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column('varchar', { length: 255, nullable: true })
  businessName!: string | null;

  @Column('varchar', { length: 255, nullable: true })
  businessAddress!: string | null;

  @Column('double', { nullable: true })
  comissionFee!: number | null;

  @Column('varchar', { nullable: true })
  leakageFee!: number | null;

  @Column('timestamp', { nullable: true })
  verificationSendDatetime!: Date | null;

  @Column('varchar', { nullable: true, length: 255 })
  personalId!: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date | null;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date | null;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt!: Date;

  @Column('integer', { nullable: true })
  lowStockReminder!: number | null;

  @Column('simple-array', { nullable: true })
  zipcodeIds!: number[] | null;

  @Column('simple-array', { nullable: true })
  accessoryIds!: number[] | null;

  @Column('boolean', { default: () => 'false' })
  isResetPassword!: boolean;

  @Column('integer', { nullable: true, default: () => '1' }) // 0 = notApproved, 1 = approved, 2 = pending
  status!: number;

  @Column('integer', { nullable: true, default: () => '1' }) // 1 = Basic Details, 2 = Business Details, 3 = Product Pricing, 4 = Accessories, 5 = Schedule, 6 = Fees Settings.
  profileCompletedStatus!: number;

  @Column('varchar', { nullable: true })
  createdBy!: string;

  @Column('varchar', { nullable: true })
  updatedBy!: string;

  @OneToOne(() => Users, (users) => users.vendor)
  @JoinColumn({ name: 'user_id' })
  user!: Users;

  @OneToMany(() => DriverDetails, (driver) => driver.vendor)
  drivers!: DriverDetails[];

  @OneToMany(() => VendorSchedule, (VSchedule) => VSchedule.vendor)
  vendorSchecules!: VendorSchedule[];

  @OneToMany(() => OrderDetails, (ODetails) => ODetails.vendor)
  orders!: OrderDetails[];

  @OneToMany(() => Cart, (cart) => cart.user)
  cart!: Cart[];

  @OneToMany(() => VendorStocks, (VStocks) => VStocks.vendor)
  vendorStocks!: VendorStocks[];
}
