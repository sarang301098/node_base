import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  BaseEntity,
  ManyToOne,
  Index,
  OneToMany,
  RelationId,
} from 'typeorm';

import { MembershipPlans } from './MembershipPlans';
import { UserSubscription } from './UserSubscription';
import { MembershipPlanDetails } from './MembershipPlanDetails';

@Entity('membership_paln_prices', { schema: 'public' })
export class MembershipPlanPrices extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column('double', { nullable: true })
  price!: number | null;

  @Column('integer', { nullable: true })
  period!: number | null;

  @Column('boolean', { default: () => 'false' })
  isActive!: boolean;

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

  @OneToMany(() => MembershipPlanDetails, (MPlanDetails) => MPlanDetails.membershipPlanPrices)
  details!: MembershipPlanDetails[];

  @Index()
  @ManyToOne(() => MembershipPlans, (MPlans) => MPlans.prices)
  membershipPlan!: MembershipPlans;

  @RelationId((MPlanPrices: MembershipPlanPrices) => MPlanPrices.membershipPlan)
  membershipPlanId!: number;

  @OneToMany(() => UserSubscription, (USubscription) => USubscription.membershipPlanPrice)
  subscription!: UserSubscription[];
}
