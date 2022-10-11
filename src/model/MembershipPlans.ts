import {
  Column,
  Entity,
  Generated,
  OneToMany,
  BaseEntity,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { UserSubscription } from './UserSubscription';
import { MembershipPlanPrices } from './MembershipPlanPrices';

@Entity('membership_palns', { schema: 'public' })
export class MembershipPlans extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column()
  @Generated('uuid')
  uuid!: string;

  @Column('varchar', { length: 255, nullable: true })
  name!: string | null;

  @Column('simple-array', { nullable: true })
  productIds!: number[] | null;

  @Column('simple-array', { nullable: true })
  categoryIds!: number[] | null;

  @Column('integer', { default: () => '0' }) // 0= N/A, 1= fuelDelivery, 2 = Tank Exchange
  type!: number | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date | null;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date | null;

  @Column('varchar', { nullable: true })
  createdBy!: string | null;

  @Column('varchar', { nullable: true })
  updatedBy!: string | null;

  @DeleteDateColumn({ type: 'timestamp' })
  deletedAt!: Date | null;

  @Column('boolean', { default: () => 'true' })
  isActive!: boolean;

  @OneToMany(() => MembershipPlanPrices, (MPlanPrices) => MPlanPrices.membershipPlan)
  prices!: MembershipPlanPrices[];

  @OneToMany(() => UserSubscription, (USubscription) => USubscription.membershipPlan)
  subscription!: UserSubscription[];
}
