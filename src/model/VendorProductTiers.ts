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

import { VendorProducts } from './VendorProducts';
import { VendorProductsPricing } from './VendorProductPricing';

@Entity('vendor_product_tiers', { schema: 'public' })
export class VendorProductTiers extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column('integer')
  from!: number;

  @Column('integer')
  to!: number;

  @Column('integer', { nullable: true })
  position!: number;

  @CreateDateColumn({ type: 'timestamp', nullable: true })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamp' })
  deletedAt!: Date | null;

  @Column('varchar', { nullable: true })
  createdBy!: string | null;

  @Column('varchar', { nullable: true })
  updatedBy!: string | null;

  @Index()
  @ManyToOne(() => VendorProducts, (VProduct) => VProduct.tiers)
  vendorProduct!: VendorProducts;

  @RelationId((VProductTiers: VendorProductTiers) => VProductTiers.vendorProduct)
  vendorProductId!: number;

  @OneToMany(() => VendorProductsPricing, (VProductPricing) => VProductPricing.vendorProductTiers)
  pricing!: VendorProductsPricing[];
}
