import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  RelationId,
  ManyToOne,
  BaseEntity,
} from 'typeorm';

import { Users } from './Users';

@Entity('user_verification_details', { schema: 'public' })
export class UserVerificationDetails extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column('boolean', { default: () => 'false' })
  verified!: boolean;

  @Column('varchar', { length: 255, nullable: true })
  tokenOrOtp!: string | null;

  @Column('integer', { default: () => 0 }) //  0-not applied, 1-email, 2-mobile
  type!: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date | null;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date | null;

  @DeleteDateColumn({ type: 'timestamp' })
  deletedAt!: Date | null;

  @Column('boolean', { default: () => 'true' })
  isActive!: boolean;

  @Index()
  @ManyToOne(() => Users, (users) => users.verificationDetails)
  user!: Users;

  @RelationId((verifications: UserVerificationDetails) => verifications.user)
  userId!: string;
}
