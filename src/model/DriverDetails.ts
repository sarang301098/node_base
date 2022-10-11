import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  OneToOne,
  JoinColumn,
  DeleteDateColumn,
  OneToMany,
  RelationId,
  Index,
  ManyToOne,
} from 'typeorm';

import { Users } from './Users';
import { Ratings } from './Ratings';
import { DriverStocks } from './DriverStocks';
import { VendorDetails } from './VendorDetails';

@Entity('driver_details', { schema: 'public' })
export class DriverDetails extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: string;

  @Column('double', { nullable: true })
  avgRating!: number | null;

  @Column('boolean', { default: () => 'false' })
  isSuspended!: boolean;

  @Column('boolean', { default: () => 'true' })
  isOnline!: boolean;

  @Column('boolean', { default: () => 'true' })
  isApproved!: boolean;

  @Column('integer', { nullable: true }) // 1 - fuel Delivery, 2 - Tank exchange
  orderType!: number | null;

  @Column('varchar', { length: 255, nullable: true })
  address!: string | null;

  @Column('varchar', { nullable: true })
  licenceImage!: string;

  @Column('simple-array', { nullable: true })
  zipcodeIds!: number[] | null;

  @Column('varchar', { nullable: true, length: 255 })
  personalId!: string | null;

  @Column('varchar', { nullable: true, length: 255 })
  idInformation!: string;

  @Column('varchar', { nullable: true, length: 255 })
  driverVehicle!: string | null;

  @Column('varchar', { nullable: true, length: 255 })
  vehicalNo!: string | null;

  @Column('integer', { nullable: true, default: () => '0' }) // 0 = notApproved, 1 = approved, 2 = pending
  status!: number | null;

  @Column('double', { nullable: true })
  lat!: number | null;

  @Column('double', { nullable: true })
  long!: number | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date | null;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date | null;

  @DeleteDateColumn({ type: 'timestamp' })
  deletedAt!: Date | null;

  @Column('varchar', { nullable: true, length: 255 })
  identity!: string;

  @Column('varchar', { nullable: true })
  updatedBy!: string | null;

  @Column('varchar', { nullable: true, length: 255 })
  licenceNo!: string;

  @Column('varchar', { nullable: true, length: 255 })
  identityInformation!: string | null;

  @Column('integer', { nullable: true })
  orderCapacity!: number | null;

  @OneToOne(() => Users, (users) => users.driver)
  @JoinColumn({ name: 'user_id' })
  user!: Users;

  @Index()
  @ManyToOne(() => VendorDetails, (VDetails) => VDetails.drivers)
  vendor!: VendorDetails;

  @RelationId((DDetails: DriverDetails) => DDetails.vendor)
  vendorId!: number;

  @OneToMany(() => Ratings, (rating) => rating.toUser)
  rating!: Ratings[];

  @OneToMany(() => DriverStocks, (DStocks) => DStocks.driver)
  driverStocks!: DriverStocks[];

  isDriverProfileComplete = (): boolean =>
    Boolean(
      this.idInformation &&
        this.driverVehicle &&
        this.vehicalNo &&
        this.orderCapacity &&
        this.licenceNo,
    );
}
