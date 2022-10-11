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
import { PromoCodes } from './Promocodes';
import { OrderDetails } from './OrderDetails';
import { VendorStocks } from './VendorStocks';
import { DriverStocks } from './DriverStocks';
import { VendorProducts } from './VendorProducts';
import { ProductsDetails } from './ProductDetails';

@Entity('products', { schema: 'public' })
export class Products extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column('varchar', { length: 255 })
  name!: string | null;

  @Column('integer', { nullable: true }) // 1 - fuel Delivery, 2 - Tank exchange
  orderType!: number | null;

  @Column('varchar', { nullable: true })
  logo!: string | null;

  @Column('integer', { nullable: true }) // 0 = notApproved, 1 = approved, 2 = pending
  status!: number | null;

  @Column('varchar', { nullable: true })
  updatedBy!: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date | null;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date | null;

  @DeleteDateColumn({ type: 'timestamp' })
  deletedAt!: Date | null;

  @Column('boolean', { default: () => 'true' })
  isActive!: boolean;

  @OneToMany(() => ProductsDetails, (productDetails) => productDetails.product)
  details!: ProductsDetails[];

  @OneToMany(() => OrderDetails, (ODetails) => ODetails.product)
  orders!: OrderDetails[];

  @OneToMany(() => Cart, (cart) => cart.product)
  cart!: Cart[];

  @OneToMany(() => PromoCodes, (promocode) => promocode.product)
  promocodes!: PromoCodes[];

  @OneToMany(() => VendorProducts, (VProducts) => VProducts.product)
  vendorProducts!: VendorProducts[];

  @OneToMany(() => VendorStocks, (VStocks) => VStocks.product)
  vendorStocks!: VendorStocks[];

  @OneToMany(() => DriverStocks, (DStocks) => DStocks.product)
  driverStocks!: DriverStocks[];
}
