import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  OneToMany,
  DeleteDateColumn,
} from 'typeorm';

import { Cart } from './Cart';
import { OrderDetails } from './OrderDetails';

@Entity('delivery_locations', { schema: 'public' })
export class DeliveryLocations extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column('varchar')
  name!: string;

  @Column('longtext', { nullable: true })
  description!: string | null;

  @Column('double', { nullable: true })
  price!: number | null;

  @Column('integer', { nullable: true, default: () => '1' }) // 0 = notApproved, 1 = approved, 2 = pending
  status!: number | null;

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

  @OneToMany(() => Cart, (cart) => cart.location)
  cart!: Cart[];

  @OneToMany(() => OrderDetails, (orders) => orders.location)
  order!: OrderDetails[];
}
