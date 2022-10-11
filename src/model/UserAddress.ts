import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  Index,
  RelationId,
  ManyToOne,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';

import { Users } from './Users';
import { Orders } from './Orders';
import { ZipCodes } from './ZipCodes';

@Entity('user_addresses', { schema: 'public' })
export class UserAddresses extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: string;

  @Column('varchar', { length: 255 })
  fullName!: string;

  @Column('varchar', { nullable: true })
  state!: string | null;

  @Column('varchar', { nullable: true })
  countryCode!: string | null;

  @Column('varchar', { nullable: true })
  phoneNumber!: string | null;

  @Column('varchar', { nullable: true })
  county!: string | null;

  @Column('varchar', { nullable: true })
  city!: string | null;

  @Column('varchar', { nullable: true })
  country!: string | null;

  @Column('varchar', { nullable: true })
  addressType!: string | null;

  @Column('boolean', { default: () => 'true' })
  isDefault!: boolean;

  @Column('varchar', { nullable: true })
  houseNo!: string | null;

  @Column('varchar', { length: 255, nullable: true })
  address!: string | null;

  @Column('varchar', { nullable: true })
  lat!: string | null;

  @Column('varchar', { nullable: true })
  long!: string | null;

  @Column('integer', { nullable: true, default: () => '1' }) // 0 = notApproved, 1 = approved, 2 = pending
  status!: number | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date | null;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date | null;

  @DeleteDateColumn({ type: 'timestamp' })
  deletedAt!: Date | null;

  @Column('boolean', { default: () => 'true' })
  isActive!: boolean;

  @Column('varchar', { nullable: true })
  createdBy!: string | null;

  @Column('varchar', { nullable: true })
  updatedBy!: string | null;

  @Index()
  @ManyToOne(() => Users, (users) => users.address)
  user!: Users | null;

  @RelationId((userAddress: UserAddresses) => userAddress.user)
  userId!: string | null;

  @Index()
  @ManyToOne(() => ZipCodes, (zipCode) => zipCode.addresses)
  zipCode!: ZipCodes | null;

  @RelationId((userAddress: UserAddresses) => userAddress.zipCode)
  zipCodeId!: number | null;

  @OneToMany(() => Orders, (order) => order.userAddress)
  orders!: Orders[];
}
