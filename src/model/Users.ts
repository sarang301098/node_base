import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  DeleteDateColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  OneToOne,
  OneToMany,
} from 'typeorm';

import { Cart } from './Cart';
import { Tokens } from './Tokens';
import { Orders } from './Orders';
import { ContactUs } from './ContactUs';
import { Documents } from './Documents';
import { UserAddresses } from './UserAddress';
import { OrderDetails } from './OrderDetails';
import { DriverDetails } from './DriverDetails';
import { VendorDetails } from './VendorDetails';
import { VendorProducts } from './VendorProducts';
import { DriverPayments } from './DriverPayments';
import { OrderStatusLogs } from './OrderStatusLogs';
import { SubAdminDetails } from './SubAdminDetails';
import { UserSubscription } from './UserSubscription';
import { VendorBankDetails } from './VendorBankDetails';
import { UserOrderStatistics } from './UserOrderStatistics';
import { FreelanceDriversPayment } from './FreelanceDriverPayments';
import { UserVerificationDetails } from './UserVerificationDetails';

import { PropaneUserType } from '../constants';
import { Ratings } from './Ratings';

@Entity('users', { schema: 'public' })
export class Users extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('varchar', { length: 255, nullable: true })
  fullName!: string;

  @Column('varchar', { length: 255, nullable: true })
  email!: string;

  @Column('varchar', { nullable: true })
  password!: string;

  @Column('varchar', { nullable: true })
  countryCode!: string | null;

  @Column('varchar', { nullable: true })
  mobileNumber!: string | null;

  @Column('varchar', { nullable: true })
  otp!: string | null;

  @Column({ type: 'enum', enum: PropaneUserType })
  userType!: string;

  @Column('varchar', { nullable: true })
  profileImage!: string;

  @Column('varchar', { length: 255, nullable: true })
  stripeCustomerId!: string;

  @Column('varchar', { length: 255, nullable: true })
  stripeAccountId!: string;

  @Column('integer', { nullable: true, default: () => '0' })
  userSubscriptionCount!: number;

  @CreateDateColumn({ type: 'timestamp', nullable: true })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date | null;

  @DeleteDateColumn({ type: 'timestamp' })
  deletedAt!: Date | null;

  @Column('varchar', { nullable: true })
  createdBy!: string | null;

  @Column('varchar', { nullable: true })
  updatedBy!: string | null;

  @Column('varchar', { nullable: true })
  adminAddress!: string | null;

  @Column('boolean', { default: () => 'true' })
  isActive!: boolean;

  @Column('timestamp', { nullable: true })
  lastPurchaseDate!: Date;

  @OneToOne(() => VendorDetails, (vendor) => vendor.user)
  vendor!: VendorDetails;

  @OneToOne(() => SubAdminDetails, (subAdmin) => subAdmin.user)
  subAdmin!: SubAdminDetails;

  @OneToOne(() => DriverDetails, (driver) => driver.user)
  driver!: DriverDetails;

  @OneToMany(() => DriverDetails, (driver) => driver.vendor)
  vendorDrivers!: DriverDetails[];

  @OneToMany(() => UserAddresses, (address) => address.user)
  address!: UserAddresses[];

  @OneToMany(() => UserVerificationDetails, (verifications) => verifications.user)
  verificationDetails!: UserVerificationDetails[];

  @OneToMany(() => VendorBankDetails, (verifications) => verifications.user)
  vendorBankDetails!: VendorBankDetails[];

  @OneToMany(() => Documents, (document) => document.user)
  documents!: Documents[];

  @OneToMany(() => Cart, (cart) => cart.user)
  cart!: Cart[];

  @OneToMany(() => Cart, (cart) => cart.vendor)
  vendorCart!: Cart[];

  @OneToMany(() => VendorProducts, (VProducts) => VProducts.vendor)
  vendorProducts!: VendorProducts[];

  @OneToMany(() => OrderDetails, (orderDetails) => orderDetails.vendor)
  vendorOrders!: OrderDetails[];

  @OneToMany(() => Orders, (order) => order.user)
  orders!: Orders[];

  @OneToMany(() => OrderDetails, (orderDetails) => orderDetails.driver)
  driverOrders!: OrderDetails[];

  @OneToMany(() => UserSubscription, (USubscription) => USubscription.user)
  subscription!: UserSubscription[];

  @OneToMany(() => Ratings, (rating) => rating.fromUser)
  fromRating!: Ratings[];

  @OneToMany(() => Ratings, (rating) => rating.toUser)
  toRating!: Ratings[];

  @OneToOne(() => Tokens, (tokens) => tokens.user)
  token!: Tokens;

  @OneToMany(() => OrderStatusLogs, (orderLogs) => orderLogs.user)
  orderLogs!: OrderStatusLogs[];

  @OneToMany(() => FreelanceDriversPayment, (FDriverPayment) => FDriverPayment.driver)
  freelanceDriversPayment!: FreelanceDriversPayment[];

  @OneToMany(() => DriverPayments, (DriverPayment) => DriverPayment.toUser)
  toDriversPayment!: DriverPayments[];

  @OneToMany(() => DriverPayments, (DriverPayment) => DriverPayment.fromUser)
  fromDriversPayment!: DriverPayments[];

  @OneToOne(() => UserOrderStatistics, (UOrderStatistics) => UOrderStatistics.user)
  orderStatistics!: UserOrderStatistics;

  @OneToMany(() => ContactUs, (ContactUs) => ContactUs.user)
  contactUs!: ContactUs[];
}
