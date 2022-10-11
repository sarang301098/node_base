import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  BaseEntity,
  ManyToOne,
  RelationId,
  Index,
} from 'typeorm';

import { Products } from './Products';
import { Accessories } from './Accessory';
import { Categories } from './Categories';
import { CylinderSizes } from './CylinderSizes';

import { VendorDetails } from './VendorDetails';

@Entity('vendor_stocks', { schema: 'public' })
export class VendorStocks extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column('timestamp', { nullable: true })
  addedAt!: Date;

  @Column('double', { nullable: true })
  addedStockQty!: number;

  @Column('double', { nullable: true })
  remainingStock!: number;

  @Column('double', { nullable: true })
  openingStock!: number;

  @Column('double', { nullable: true })
  soldOutStock!: number;

  @Column('double', { nullable: true, select: false })
  addedFilled!: number;

  @Column('double', { nullable: true })
  addedEmpty!: number;

  @Column('double', { nullable: true })
  returnedFilled!: number;

  @Column('double', { nullable: true })
  returnedEmpty!: number;

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

  @Index()
  @ManyToOne(() => Categories, (category) => category.vendorStocks)
  category!: Categories;

  @RelationId((VStock: VendorStocks) => VStock.category)
  categoryId!: number;

  @Index()
  @ManyToOne(() => CylinderSizes, (CSize) => CSize.vendorStocks)
  cylinderSize!: CylinderSizes;

  @RelationId((VStock: VendorStocks) => VStock.cylinderSize)
  cylinderSizeId!: number;

  @Index()
  @ManyToOne(() => Accessories, (accessory) => accessory.vendorStocks)
  accessory!: Accessories;

  @RelationId((VStock: VendorStocks) => VStock.accessory)
  accessoryId!: number;

  @Index()
  @ManyToOne(() => Products, (product) => product.vendorStocks)
  product!: Products;

  @RelationId((VStock: VendorStocks) => VStock.product)
  productId!: number;

  @Index()
  @ManyToOne(() => VendorDetails, (VDetails) => VDetails.vendorStocks)
  vendor!: VendorDetails;

  @RelationId((VStock: VendorStocks) => VStock.vendor)
  vendorId!: number;
}
