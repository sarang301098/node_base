import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';

import { Users } from './Users';
import { PropaneUserType } from '../constants';

@Entity('contact_us', { schema: 'public' })
export class ContactUs extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column('varchar', { nullable: true })
  subject!: string;

  @Column('varchar', { length: 255, nullable: true })
  message!: string;

  @Column({ type: 'enum', enum: PropaneUserType })
  userType!: string;

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

  @Index()
  @ManyToOne(() => Users, (user) => user.contactUs)
  user!: Users;

  @RelationId((contactUs: ContactUs) => contactUs.user)
  userId!: string;
}
