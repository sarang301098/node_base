import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  Generated,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  BaseEntity,
  ManyToOne,
  RelationId,
  Index,
  OneToMany,
} from 'typeorm';

import { Users } from './Users';
import { TimeSlots } from './TimeSlots';
import { UserAddresses } from './UserAddress';
import { OrderDetails } from './OrderDetails';

@Entity('orders', { schema: 'public' })
export class Orders extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column()
  @Generated('uuid')
  uuid!: string;

  @Column('varchar', { nullable: true })
  invoicedReceiptUrl!: string | null;

  @Column('varchar', { nullable: true })
  cancellationReasonOther!: string | null;

  @Column('double', { nullable: true })
  serviceFee!: number | null;

  @Column('double', { nullable: true })
  serviceCharge!: number | null;

  @Column('double', { nullable: true })
  grandTotal!: number | null;

  @Column('double', { nullable: true })
  adminTotalDeliveryFee!: number | null;

  @Column('double', { nullable: true })
  vendorTotalDeliveryfee!: number | null;

  @Column('integer', { nullable: true })
  paymentType!: number | null;

  @Column('varchar', { nullable: true })
  lat!: string | null;

  @Column('varchar', { nullable: true })
  long!: string | null;

  @Column('varchar', { nullable: true })
  address!: string | null;

  @Column('varchar', { nullable: true })
  stripePaymentIntentId!: string | null;

  @Column('boolean', { default: () => 'false' })
  isPaid!: boolean;

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

  @OneToMany(() => OrderDetails, (orderDetails) => orderDetails.order)
  details!: OrderDetails[];

  @Index()
  @ManyToOne(() => TimeSlots, (user) => user.orders)
  timeSlot!: TimeSlots | null;

  @RelationId((order: Orders) => order.timeSlot)
  timeSlotsId!: number | null;

  @Index()
  @ManyToOne(() => UserAddresses, (address) => address.orders)
  userAddress!: UserAddresses;

  @RelationId((order: Orders) => order.userAddress)
  userAddressId!: number;

  @Index()
  @ManyToOne(() => Users, (user) => user.orders)
  user!: Users | null;

  @RelationId((order: Orders) => order.user)
  userId!: string | null;
}
