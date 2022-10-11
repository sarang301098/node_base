import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  BaseEntity,
  ManyToOne,
  OneToMany,
  RelationId,
  Index,
} from 'typeorm';

import { Users } from './Users';
import { Orders } from './Orders';
import { Ratings } from './Ratings';
import { Products } from './Products';
import { Categories } from './Categories';
import { Accessories } from './Accessory';
import { PromoCodes } from './Promocodes';
import { CylinderSizes } from './CylinderSizes';
import { OrderStatusLogs } from './OrderStatusLogs';
import { EmegergencyOrders } from './EmegergencyOrders';
import { DeliveryLocations } from './deliveryLocations';
import { CancellationReasons } from './CancellationReasons';
import { FreelanceDriversPayment } from './FreelanceDriverPayments';

import { OrderStatus } from '../constants';
import { ZipCodes } from './ZipCodes';

@Entity('order_details', { schema: 'public' })
export class OrderDetails extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column('integer', { nullable: true }) // 1 - fuel Delivery, 2 - Tank exchange
  orderType!: number;

  @Column({ type: 'enum', enum: OrderStatus })
  status!: string;

  @Column('varchar', { nullable: true })
  imageOne!: string | null;

  @Column('varchar', { nullable: true })
  imageTwo!: string | null;

  @Column('time', { nullable: true })
  startTime!: Date;

  @Column('time', { nullable: true })
  endTime!: Date;

  @Column('double', { nullable: true }) // amount of the products with vendor's delivery, quantity and product price.
  subTotal!: number;

  @Column('double', { nullable: true }) // subtotal + other charges
  grandTotal!: number;

  @Column('double', { nullable: true })
  leakageFee!: number;

  @Column('timestamp', { nullable: true })
  scheduleDate!: Date;

  @Column('double', { nullable: true })
  indexPrice!: number;

  @Column('double', { nullable: true })
  vendorDeliveryFee!: number;

  @Column('double', { nullable: true })
  generalDeliveryFee!: number;

  @Column('double', { nullable: true })
  vendorReceivedAmount!: number;

  @Column('double', { nullable: true, default: () => '0' })
  freelanceDriverReceivedAmount!: number;

  @Column('double', { nullable: true })
  driverCancellationCharge!: number;

  @Column('double', { nullable: true })
  customerCancellationCharge!: number;

  @Column('double', { nullable: true })
  adminReceivedAmount!: number;

  @Column('double', { nullable: true })
  refundAmount!: number;

  @Column('double', { nullable: true })
  serviceFee!: number;

  @Column('double', { nullable: true })
  serviceCharge!: number;

  @Column('double', { nullable: true })
  deliveryFees!: number;

  @Column('varchar', { nullable: true })
  cancellationReasonOther!: string | null;

  @Column('double', { nullable: true })
  salesTaxPercentage!: number;

  @Column('double', { nullable: true })
  salesTaxAmount!: number;

  @Column('double', { nullable: true })
  locationFee!: number;

  @Column('double', { nullable: true })
  cylindersize!: number;

  @Column('integer', { nullable: true })
  qty!: number;

  @Column('integer', { nullable: true })
  priority!: number;

  @Column('boolean', { default: () => 'false' })
  isDelivered!: boolean;

  @Column('boolean', { default: () => 'false' })
  isPaid!: boolean;

  @Column('boolean', { default: () => 'false' })
  isRefunded!: boolean;

  @Column('varchar', { nullable: true })
  stripePaymentIntentId!: string | null;

  @Column('varchar', { nullable: true })
  stripePaymentTransferId!: string | null;

  @Column('double', { nullable: true })
  promocodeDiscountAmount!: number;

  @Column('double', { nullable: true })
  promocodeDiscountPercentage!: number;

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

  @Index()
  @ManyToOne(() => Orders, (order) => order.details)
  order!: Orders;

  @RelationId((orderDetail: OrderDetails) => orderDetail.order)
  orderId!: number;

  @Index()
  @ManyToOne(() => Products, (product) => product.orders)
  product!: Products;

  @RelationId((orderDetail: OrderDetails) => orderDetail.product)
  productId!: number;

  @Index()
  @ManyToOne(() => Users, (vendor) => vendor.vendorOrders)
  vendor!: Users;

  @RelationId((orderDetail: OrderDetails) => orderDetail.vendor)
  vendorId!: string;

  @Index()
  @ManyToOne(() => Users, (driver) => driver.driverOrders)
  driver!: Users;

  @RelationId((orderDetail: OrderDetails) => orderDetail.driver)
  driverId!: string;

  @Index()
  @ManyToOne(() => DeliveryLocations, (DLocations) => DLocations.order)
  location!: DeliveryLocations;

  @RelationId((orderDetail: OrderDetails) => orderDetail.location)
  locationId!: number;

  @Index()
  @ManyToOne(() => CylinderSizes, (CSize) => CSize.orders)
  cylinderSize!: CylinderSizes;

  @RelationId((orderDetail: OrderDetails) => orderDetail.cylinderSize)
  cylinderSizeId!: number;

  @Index()
  @ManyToOne(() => Categories, (CSize) => CSize.orders)
  category!: Categories;

  @RelationId((orderDetail: OrderDetails) => orderDetail.category)
  categoryId!: number;

  @Index()
  @ManyToOne(() => Accessories, (accesory) => accesory.orders)
  accessory!: Accessories;

  @RelationId((orderDetail: OrderDetails) => orderDetail.accessory)
  accessoryId!: number;

  @Index()
  @ManyToOne(() => PromoCodes, (promocodes) => promocodes.orders)
  promocodes!: PromoCodes;

  @RelationId((orderDetail: OrderDetails) => orderDetail.promocodes)
  promocodeId!: number;

  @Index()
  @ManyToOne(() => CancellationReasons, (CReason) => CReason.orders)
  cancellationReason!: CancellationReasons;

  @RelationId((orderDetail: OrderDetails) => orderDetail.cancellationReason)
  cancellationReasonId!: number;

  @OneToMany(() => Ratings, (rating) => rating.orderDetail)
  rating!: Ratings[];

  @OneToMany(() => FreelanceDriversPayment, (payment) => payment.order)
  freelanceDriverPayment!: FreelanceDriversPayment[];

  @OneToMany(() => OrderStatusLogs, (orderLogs) => orderLogs.user)
  orderLogs!: OrderStatusLogs[];

  @OneToMany(() => EmegergencyOrders, (emegergencyOrder) => emegergencyOrder.order)
  emegergencyOrder!: EmegergencyOrders[];

  @Index()
  @ManyToOne(() => ZipCodes, (zipcode) => zipcode.cart)
  zipcode!: ZipCodes;

  @RelationId((cart: OrderDetails) => cart.zipcode)
  zipcodeId!: number;
}
