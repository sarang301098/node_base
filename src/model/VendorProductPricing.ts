import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  BaseEntity,
  ManyToOne,
  Index,
  RelationId,
} from 'typeorm';

import { Categories } from './Categories';
import { CylinderSizes } from './CylinderSizes';
import { VendorProducts } from './VendorProducts';
import { VendorProductTiers } from './VendorProductTiers';

@Entity('vendor_product_pricing_tiers', { schema: 'public' })
export class VendorProductsPricing extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column('double', { nullable: true })
  price!: number | null;

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

  @Index()
  @ManyToOne(() => VendorProducts, (VProduct) => VProduct.pricing)
  vendorProduct!: VendorProducts;

  @RelationId((VProductPricing: VendorProductsPricing) => VProductPricing.vendorProduct)
  vendorProductId!: number;

  @Index()
  @ManyToOne(() => VendorProductTiers, (VProduct) => VProduct.pricing)
  vendorProductTiers!: VendorProductTiers;

  @RelationId((VProductPricing: VendorProductsPricing) => VProductPricing.vendorProductTiers)
  vendorProductTiersId!: number;

  @Index()
  @ManyToOne(() => CylinderSizes, (CSize) => CSize.vendorPricing)
  cylinderSize!: CylinderSizes;

  @RelationId((VProductPricing: VendorProductsPricing) => VProductPricing.cylinderSize)
  cylinderSizeId!: number;

  @Index()
  @ManyToOne(() => Categories, (category) => category.vendorPricing)
  category!: Categories;

  @RelationId((VProductPricing: VendorProductsPricing) => VProductPricing.category)
  categoryId!: number;
}
