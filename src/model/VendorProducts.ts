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
import { Products } from './Products';
import { VendorProductTiers } from './VendorProductTiers';
import { VendorProductsPricing } from './VendorProductPricing';

@Entity('vendor_products', { schema: 'public' })
export class VendorProducts extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date | null;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date | null;

  @DeleteDateColumn({ type: 'timestamp' })
  deletedAt!: Date | null;

  @Column('varchar', { nullable: true })
  createdBy!: string;

  @Column('varchar', { nullable: true })
  updatedBy!: string;

  @Column('simple-array', { nullable: true })
  zipcodeIds!: number[] | null;

  @Column('boolean', { default: () => 'true' })
  isSalesTax!: boolean;

  @Column('boolean', { default: () => 'false' })
  isCompleted!: boolean;

  @Column('integer', { nullable: true })
  orderType!: number;

  @Index()
  @ManyToOne(() => Users, (users) => users.vendorProducts)
  vendor!: Users;

  @RelationId((VProduct: VendorProducts) => VProduct.vendor)
  vendorId!: number;

  @Index()
  @ManyToOne(() => Products, (products) => products.vendorProducts)
  product!: Products;

  @RelationId((VProduct: VendorProducts) => VProduct.product)
  productId!: number;

  @OneToMany(() => VendorProductTiers, (VProductTiers) => VProductTiers.vendorProduct)
  tiers!: VendorProductTiers[];

  @OneToMany(() => VendorProductsPricing, (VProductPricing) => VProductPricing.vendorProduct)
  pricing!: VendorProductsPricing[];
}
