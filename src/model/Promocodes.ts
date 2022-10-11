import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  BaseEntity,
  OneToMany,
  ManyToOne,
} from 'typeorm';

import { Cart } from './Cart';
import { Products } from './Products';
import { OrderDetails } from './OrderDetails';

@Entity('promocodes', { schema: 'public' })
export class PromoCodes extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: string;

  @Column('varchar', { length: 255 })
  title!: string;

  @Column('varchar', { length: 255 })
  promocode!: string;

  @Column('integer', { nullable: true }) // 1 - fuel Delivery, 2 - Tank exchange
  orderType!: number;

  @Column('integer', { nullable: true })
  discount!: number;

  @Column('timestamp', { nullable: true })
  startAt!: Date;

  @Column('timestamp', { nullable: true })
  endAt!: Date;

  @Column('simple-array', { nullable: true })
  categoryIds!: number[] | null;

  @Column('simple-array', { nullable: true })
  customerIds!: string[] | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt!: Date;

  @Column('varchar', { nullable: true })
  createdBy!: string;

  @Column('varchar', { nullable: true })
  updatedBy!: string;

  @Column('boolean', { default: () => 'true' })
  isActive!: boolean;

  @ManyToOne(() => Products, (product) => product.promocodes)
  product!: Products | null;

  @OneToMany(() => Cart, (cart) => cart.promocode)
  cart!: Cart | null;

  @OneToMany(() => OrderDetails, (ODetails) => ODetails.accessory)
  orders!: OrderDetails[];
}
