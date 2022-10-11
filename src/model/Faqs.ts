import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  BaseEntity,
} from 'typeorm';

import { PropaneUserType } from '../constants';

@Entity('faqs', { schema: 'public' })
export class Faqs extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: string;

  @Column({ type: 'enum', enum: PropaneUserType })
  userType!: string | null;

  @Column('varchar', { length: 255 })
  question!: string;

  @Column('varchar', { length: 255 })
  answer!: string | null;

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

  @Column('boolean', { default: () => 'true' })
  isActive!: boolean;
}
