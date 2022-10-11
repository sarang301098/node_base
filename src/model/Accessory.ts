import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  BaseEntity,
  OneToMany,
} from 'typeorm';

import { Cart } from './Cart';
import { VendorStocks } from './VendorStocks';
import { OrderDetails } from './OrderDetails';
@Entity('accessories', { schema: 'public' })
export class Accessories extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column('varchar', { length: 255 })
  name!: string;

  @Column('varchar', { length: 255 })
  image!: string;

  @Column('integer', { nullable: true })
  price!: number;

  @Column('varchar', { nullable: true })
  description!: string | null;

  @Column('integer', { nullable: true, default: () => '1' }) // 0 = notApproved, 1 = approved, 2 = pending
  status!: number | null;

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

  @OneToMany(() => Cart, (cart) => cart.accessory)
  cart!: Cart[];

  @OneToMany(() => OrderDetails, (ODetails) => ODetails.accessory)
  orders!: OrderDetails[];

  @OneToMany(() => VendorStocks, (VStocks) => VStocks.accessory)
  vendorStocks!: VendorStocks[];

  @OneToMany(() => VendorStocks, (VStocks) => VStocks.accessory)
  driverStocks!: VendorStocks[];
}
