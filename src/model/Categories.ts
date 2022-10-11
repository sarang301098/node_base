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
import { VendorStocks } from './VendorStocks';
import { DriverStocks } from './DriverStocks';
import { OrderDetails } from './OrderDetails';
import { ProductsDetails } from './ProductDetails';
import { VendorProductsPricing } from './VendorProductPricing';

@Entity('categories', { schema: 'public' })
export class Categories extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column('varchar', { length: 255 })
  name!: string;

  @Column('integer', { nullable: true })
  orderType!: number;

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

  @OneToMany(() => ProductsDetails, (productDetails) => productDetails.category)
  productDetails!: ProductsDetails[];

  @OneToMany(() => Cart, (cart) => cart.category)
  cart!: Cart[];

  @OneToMany(() => OrderDetails, (ODetails) => ODetails.category)
  orders!: OrderDetails[];

  @OneToMany(() => VendorProductsPricing, (VProductPricing) => VProductPricing.category)
  vendorPricing!: VendorProductsPricing[];

  @OneToMany(() => VendorStocks, (VStocks) => VStocks.category)
  vendorStocks!: VendorStocks[];

  @OneToMany(() => DriverStocks, (DStocks) => DStocks.category)
  driverStocks!: DriverStocks[];
}
