import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  JoinColumn,
  BaseEntity,
  ManyToOne,
  RelationId,
  Index,
} from 'typeorm';

import { Products } from './Products';
import { Accessories } from './Accessory';
import { Categories } from './Categories';
import { CylinderSizes } from './CylinderSizes';
import { DriverDetails } from './DriverDetails';

@Entity('driver_stocks', { schema: 'public' })
export class DriverStocks extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column('timestamp', { nullable: true })
  addedAt!: Date;

  @Column('double', { nullable: true })
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
  @ManyToOne(() => Categories, (category) => category.driverStocks)
  category!: Categories;

  @RelationId((DStock: DriverStocks) => DStock.category)
  categoryId!: number;

  @Index()
  @ManyToOne(() => CylinderSizes, (CSize) => CSize.driverStocks)
  cylinderSize!: CylinderSizes;

  @RelationId((DStock: DriverStocks) => DStock.cylinderSize)
  cylinderSizeId!: number;

  @Index()
  @ManyToOne(() => Accessories, (accessory) => accessory.driverStocks)
  accessory!: Accessories;

  @RelationId((DStock: DriverStocks) => DStock.accessory)
  accessoryId!: number;

  @Index()
  @ManyToOne(() => Products, (product) => product.driverStocks)
  product!: Products;

  @RelationId((DStock: DriverStocks) => DStock.product)
  productId!: number;

  @ManyToOne(() => DriverDetails, (DDetails) => DDetails.driverStocks)
  @JoinColumn()
  driver!: DriverDetails;
}
