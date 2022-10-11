import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  Index,
  ManyToOne,
  RelationId,
  DeleteDateColumn,
} from 'typeorm';

import { Users } from './Users';

@Entity('vendor_bank_details', { schema: 'public' })
export class VendorBankDetails extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: string;

  @Column('varchar', { length: 255 })
  bankName!: string;

  @Column('varchar', { length: 255 })
  accountHolderName!: string;

  @Column('bigint', { nullable: true })
  accountNumber!: string;

  @Column('varchar', { length: 255, nullable: true })
  branchName!: string;

  @Column('varchar', { length: 255, nullable: true })
  branchCode!: number;

  @CreateDateColumn({ type: 'timestamp', nullable: true })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt!: Date;

  @Column('varchar', { nullable: true })
  createdBy!: string;

  @Column('varchar', { nullable: true })
  updatedBy!: string;

  @Column('boolean', { default: () => 'true' })
  isActive!: boolean;

  @Index()
  @ManyToOne(() => Users, (users) => users.vendorBankDetails)
  user!: Users;

  @RelationId((bankDetails: VendorBankDetails) => bankDetails.user)
  userId!: string;
}
