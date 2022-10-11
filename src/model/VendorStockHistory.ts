import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';
import { Accessories } from './Accessory';
import { Categories } from './Categories';
import { CylinderSizes } from './CylinderSizes';
import { Products } from './Products';
import { VendorDetails } from './VendorDetails';
import { VendorStocks } from './VendorStocks';

@Entity('vendro_stock_history', { schema: 'public' })
export class vendroStockHistory extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column('timestamp', { nullable: true })
  addedAt!: Date;

  @Column('double', { nullable: true })
  addedStockQty!: number;

  @Column('double', { nullable: true })
  returnStockQty!: number;

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

  @ManyToOne(() => Products, (product) => product.vendorStocks)
  @JoinColumn()
  product!: Products;

  @ManyToOne(() => VendorDetails, (VDetails) => VDetails.vendorStocks)
  @JoinColumn()
  vendor!: VendorDetails;
}
