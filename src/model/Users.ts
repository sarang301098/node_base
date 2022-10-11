import {
  Column,
  Entity,
  OneToOne,
  OneToMany,
  BaseEntity,
  DeleteDateColumn,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Tokens } from './Tokens';
import { ContactUs } from './ContactUs';

import { PropaneUserType } from '../constants';

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

  @OneToOne(() => Tokens, (tokens) => tokens.user)
  token!: Tokens;

  @OneToMany(() => ContactUs, (ContactUs) => ContactUs.user)
  contactUs!: ContactUs[];
}
