import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  BaseEntity,
  ManyToOne,
  JoinColumn,
  Generated,
  Index,
  RelationId,
} from 'typeorm';

import { Users } from './Users';
import { Products } from './Products';
import { ZipCodes } from './ZipCodes';
import { TimeSlots } from './TimeSlots';
import { Accessories } from './Accessory';
import { Categories } from './Categories';
import { PromoCodes } from './Promocodes';
import { CylinderSizes } from './CylinderSizes';
import { DeliveryLocations } from './deliveryLocations';

@Entity('cart', { schema: 'public' })
export class Cart extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column()
  @Generated('uuid')
  uuid!: string;

  @Column('integer', { nullable: true }) // 1 - fuel Delivery, 2 - Tank exchange
  orderType!: number | null;

  @Column('double', { nullable: true })
  qty!: number | null;

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

  @Column('timestamp', { nullable: true })
  scheduleDate!: Date;

  @Column('double', { nullable: true })
  lekageFee!: number | null;

  @Column('boolean', { default: () => 'true' })
  isActive!: boolean;

  @ManyToOne(() => Users, (user) => user.cart)
  @JoinColumn()
  user!: Users;

  @Index()
  @ManyToOne(() => Users, (vendor) => vendor.vendorCart)
  vendor!: Users;

  @RelationId((cart: Cart) => cart.vendor)
  vendorId!: string;

  @Index()
  @ManyToOne(() => Products, (product) => product.cart)
  product!: Products;

  @RelationId((cart: Cart) => cart.product)
  productId!: number;

  @Index()
  @ManyToOne(() => Accessories, (accessory) => accessory.cart)
  accessory!: Accessories;

  @RelationId((cart: Cart) => cart.accessory)
  accessoryId!: number;

  @ManyToOne(() => DeliveryLocations, (location) => location.cart)
  @JoinColumn()
  location!: DeliveryLocations;

  @Index()
  @ManyToOne(() => CylinderSizes, (CSize) => CSize.cart)
  cylindersize!: CylinderSizes;

  @RelationId((cart: Cart) => cart.cylindersize)
  cylindersizeId!: number;

  @Index()
  @ManyToOne(() => Categories, (category) => category.cart)
  category!: Categories;

  @RelationId((cart: Cart) => cart.category)
  categoryId!: number;

  @Index()
  @ManyToOne(() => TimeSlots, (timeslot) => timeslot.cart)
  timeslot!: TimeSlots;

  @RelationId((cart: Cart) => cart.timeslot)
  timeslotId!: number;

  @Index()
  @ManyToOne(() => ZipCodes, (zipcode) => zipcode.cart)
  zipcode!: ZipCodes;

  @RelationId((cart: Cart) => cart.zipcode)
  zipcodeId!: number;

  @Index()
  @ManyToOne(() => PromoCodes, (promocode) => promocode.cart)
  promocode!: PromoCodes;

  @RelationId((cart: Cart) => cart.promocode)
  promocodeId!: number;
}
