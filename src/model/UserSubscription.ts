import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  DeleteDateColumn,
  ManyToOne,
  Index,
  RelationId,
} from 'typeorm';

import { Users } from './Users';
import { MembershipPlanPrices } from './MembershipPlanPrices';
import { MembershipPlans } from './MembershipPlans';

@Entity('user_subscription', { schema: 'public' })
export class UserSubscription extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column('timestamp', { nullable: true })
  startDate!: Date | null;

  @Column('timestamp', { nullable: true })
  endDate!: Date | null;

  @Column('double', { nullable: true })
  price!: number | null;

  @Column('varchar', { nullable: true })
  paymentResponse!: string | null;

  @Column('varchar', { nullable: true })
  stripePaymentIntentId!: string | null;

  @Column('varchar', { nullable: true })
  platform!: string | null;

  @Column('varchar', { nullable: true })
  latestReceipt!: string | null;

  @Column('timestamp', { nullable: true })
  cancelledDate!: Date | null;

  @CreateDateColumn({ type: 'timestamp', nullable: true })
  createdAt!: Date | null;

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  updatedAt!: Date | null;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt!: Date | null;

  @Column('boolean', { default: () => 'false' })
  isActive!: boolean | null;

  @Column('integer', { nullable: true, default: () => '0' }) // 0 = N/A, 1 = initiated, 2 = payment_received
  status!: number | null;

  @Column('varchar', { nullable: true })
  createdBy!: string | null;

  @Column('varchar', { nullable: true })
  updatedBy!: string | null;

  @Index()
  @ManyToOne(() => Users, (user) => user.subscription)
  user!: Users;

  @RelationId((subscription: UserSubscription) => subscription.user)
  userId!: string;

  @Index()
  @ManyToOne(() => MembershipPlans, (membershipPlan) => membershipPlan.subscription)
  membershipPlan!: MembershipPlans;

  @RelationId((subscription: UserSubscription) => subscription.membershipPlan)
  membershipPlanId!: number;

  @Index()
  @ManyToOne(() => MembershipPlanPrices, (membershipPlanPrice) => membershipPlanPrice.subscription)
  membershipPlanPrice!: MembershipPlanPrices;

  @RelationId((subscription: UserSubscription) => subscription.membershipPlanPrice)
  membershipPlanPriceId!: number;
}
