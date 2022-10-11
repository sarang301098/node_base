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
import { VendorStocks } from './VendorStocks';
import { DriverStocks } from './DriverStocks';
import { VendorProductsPricing } from './VendorProductPricing';

@Entity('cylinder_sizes', { schema: 'public' })
export class CylinderSizes extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: string;

  @Column('double')
  cylinderSize!: number;

  @Column('integer', { nullable: true, default: () => '1' }) // 0 = notApproved, 1 = approved, 2 = pending
  status!: number | null;

  @Column('boolean', { default: () => 'true' })
  isActive!: boolean;

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

  @OneToMany(() => Cart, (cart) => cart.cylindersize)
  cart!: Cart[];

  @OneToMany(() => OrderDetails, (ODetails) => ODetails.cylinderSize)
  orders!: OrderDetails[];

  @OneToMany(() => VendorProductsPricing, (VProductPricing) => VProductPricing.cylinderSize)
  vendorPricing!: VendorProductsPricing[];

  @OneToMany(() => VendorStocks, (VStocks) => VStocks.cylinderSize)
  vendorStocks!: VendorStocks[];

  @OneToMany(() => DriverStocks, (DStocks) => DStocks.cylinderSize)
  driverStocks!: DriverStocks[];
}
