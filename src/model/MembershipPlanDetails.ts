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
  RelationId,
} from 'typeorm';

import { MembershipPlanPrices } from './MembershipPlanPrices';

@Entity('membership_paln_details', { schema: 'public' })
export class MembershipPlanDetails extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column('varchar', { length: 255, nullable: true })
  label!: string | null;

  @Column('double', { nullable: true })
  value!: number | null;

  @Column('integer', { nullable: true })
  key!: number | null;

  @Column('boolean', { default: () => 'false' })
  isPercentage!: boolean;

  @Column('boolean', { default: () => 'false' })
  isDollar!: boolean;

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

  @Index()
  @ManyToOne(() => MembershipPlanPrices, (MPlanPrices) => MPlanPrices.details)
  membershipPlanPrices!: MembershipPlanPrices;

  @RelationId((MPlanDetails: MembershipPlanDetails) => MPlanDetails.membershipPlanPrices)
  membershipPlanPricesId!: number;
}
